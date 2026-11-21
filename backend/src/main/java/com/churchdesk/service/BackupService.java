package com.churchdesk.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.*;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * Automatic backups. Every night (and on demand) the database is saved with pg_dump and the uploaded documents are zipped.
 * Both go to app.backup.dir, and a second copy goes to app.backup.copy-to (a USB disk or network folder) when that is set.
 * Old backups are removed after app.backup.keep-days, but the newest few are always kept.
 */
@Service
public class BackupService {
    private static final Logger log = LoggerFactory.getLogger(BackupService.class);
    private static final Pattern NAME = Pattern.compile("churchdesk-\\d{8}-\\d{6}(-files\\.zip|\\.dump)");
    private static final Pattern JDBC = Pattern.compile("jdbc:postgresql://([^:/]+)(?::(\\d+))?/([^?]+).*");
    private static final DateTimeFormatter STAMP = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss");

    public record Item(String name, long sizeBytes, Instant createdAt, String kind) {}
    public record Status(boolean enabled, String directory, String copyTo, String schedule, int keepDays, Instant lastOk, String lastBy, String lastError, List<Item> items) {}

    private final Path dir, copyTo, uploads;
    private final int keepDays;
    private final String pgDump, schedule, dbUrl, dbUser, dbPass;
    private final boolean enabled;
    private final AuditService audit;
    private volatile Instant lastOk; private volatile String lastBy, lastError;

    public BackupService(AuditService audit,
                         @Value("${app.backup.enabled:true}") boolean enabled,
                         @Value("${app.backup.dir:./backups}") String dir,
                         @Value("${app.backup.copy-to:}") String copyTo,
                         @Value("${app.backup.keep-days:30}") int keepDays,
                         @Value("${app.backup.cron:0 0 2 * * *}") String schedule,
                         @Value("${app.backup.pg-dump:pg_dump}") String pgDump,
                         @Value("${app.storage.dir:./uploads}") String uploads,
                         @Value("${spring.datasource.url}") String dbUrl,
                         @Value("${spring.datasource.username}") String dbUser,
                         @Value("${spring.datasource.password}") String dbPass) {
        this.audit = audit; this.enabled = enabled; this.keepDays = Math.max(1, keepDays); this.schedule = schedule; this.pgDump = pgDump;
        this.dir = Path.of(dir).toAbsolutePath().normalize();
        this.copyTo = copyTo == null || copyTo.isBlank() ? null : Path.of(copyTo).toAbsolutePath().normalize();
        this.uploads = Path.of(uploads).toAbsolutePath().normalize();
        this.dbUrl = dbUrl; this.dbUser = dbUser; this.dbPass = dbPass;
    }

    /** Runs every night, at 02:00 Addis Ababa time unless app.backup.cron says otherwise. */
    @Scheduled(cron = "${app.backup.cron:0 0 2 * * *}", zone = "Africa/Addis_Ababa")
    public void nightly() {
        if (!enabled) return;
        try { run("system"); } catch (Exception e) { log.error("Nightly backup failed: {}", e.getMessage()); }
    }

    /** Makes one backup set now. Returns its files. */
    public synchronized List<Item> run(String by) {
        try {
            Files.createDirectories(dir);
            String stamp = LocalDateTime.now(java.time.ZoneId.of("Africa/Addis_Ababa")).format(STAMP);
            Path dump = dir.resolve("churchdesk-" + stamp + ".dump"), zip = dir.resolve("churchdesk-" + stamp + "-files.zip");
            dumpDatabase(dump);
            zipUploads(zip);
            if (copyTo != null) {
                try { Files.createDirectories(copyTo); Files.copy(dump, copyTo.resolve(dump.getFileName()), StandardCopyOption.REPLACE_EXISTING); Files.copy(zip, copyTo.resolve(zip.getFileName()), StandardCopyOption.REPLACE_EXISTING); }
                catch (IOException e) { throw new IllegalStateException("The backup was made, but the second copy to " + copyTo + " failed: " + e.getMessage()); }
            }
            prune();
            lastOk = Instant.now(); lastBy = by; lastError = null;
            audit.record(by, "BACKUP", "backup", stamp, "Backup made");
            return List.of(item(dump), item(zip));
        } catch (RuntimeException e) { lastError = e.getMessage(); log.error("Backup failed: {}", e.getMessage()); throw e; }
        catch (IOException e) { lastError = e.getMessage(); throw new IllegalStateException("Backup failed: " + e.getMessage()); }
    }

    private void dumpDatabase(Path out) throws IOException {
        Matcher m = JDBC.matcher(dbUrl);
        if (!m.matches()) throw new IllegalStateException("The database address is not a PostgreSQL address, so it cannot be backed up automatically.");
        ProcessBuilder pb = new ProcessBuilder(pgDump, "-h", m.group(1), "-p", m.group(2) == null ? "5432" : m.group(2), "-U", dbUser, "-Fc", "-f", out.toString(), m.group(3));
        pb.environment().put("PGPASSWORD", dbPass);
        pb.redirectErrorStream(true);
        Process p;
        try { p = pb.start(); }
        catch (IOException e) { throw new IllegalStateException("pg_dump was not found on this computer. Install the PostgreSQL client tools, or set BACKUP_PG_DUMP to the full path of pg_dump."); }
        String output = new String(p.getInputStream().readAllBytes());
        try { if (!p.waitFor(15, java.util.concurrent.TimeUnit.MINUTES)) { p.destroyForcibly(); throw new IllegalStateException("The database backup took too long and was stopped."); } }
        catch (InterruptedException e) { Thread.currentThread().interrupt(); throw new IllegalStateException("The backup was interrupted."); }
        if (p.exitValue() != 0) { Files.deleteIfExists(out); throw new IllegalStateException("The database backup failed: " + output.strip().lines().reduce((a, b) -> b).orElse("unknown error")); }
    }

    private void zipUploads(Path out) throws IOException {
        try (OutputStream os = Files.newOutputStream(out); ZipOutputStream z = new ZipOutputStream(os); Stream<Path> files = Files.exists(uploads) ? Files.walk(uploads) : Stream.empty()) {
            for (Path f : (Iterable<Path>) files.filter(Files::isRegularFile)::iterator) {
                z.putNextEntry(new ZipEntry(uploads.relativize(f).toString().replace('\\', '/')));
                Files.copy(f, z); z.closeEntry();
            }
        }
    }

    /** Removes backups older than the keep time, but never the newest three sets. */
    private void prune() throws IOException {
        List<Path> dumps;
        try (Stream<Path> s = Files.list(dir)) { dumps = s.filter(p -> p.getFileName().toString().endsWith(".dump")).sorted(Comparator.comparing(p -> p.getFileName().toString())).toList(); }
        Instant limit = Instant.now().minusSeconds(keepDays * 86400L);
        for (int i = 0; i < dumps.size() - 3; i++) {
            Path d = dumps.get(i);
            if (Files.getLastModifiedTime(d).toInstant().isBefore(limit)) {
                String base = d.getFileName().toString().replace(".dump", "");
                Files.deleteIfExists(d); Files.deleteIfExists(dir.resolve(base + "-files.zip"));
                if (copyTo != null) { Files.deleteIfExists(copyTo.resolve(base + ".dump")); Files.deleteIfExists(copyTo.resolve(base + "-files.zip")); }
            }
        }
    }

    private Item item(Path p) {
        try { return new Item(p.getFileName().toString(), Files.size(p), Files.getLastModifiedTime(p).toInstant(), p.getFileName().toString().endsWith(".dump") ? "database" : "documents"); }
        catch (IOException e) { return new Item(p.getFileName().toString(), 0, Instant.EPOCH, "database"); }
    }

    public Status status() {
        List<Item> items = new ArrayList<>();
        if (Files.isDirectory(dir)) try (Stream<Path> s = Files.list(dir)) { s.filter(p -> NAME.matcher(p.getFileName().toString()).matches()).map(this::item).forEach(items::add); } catch (IOException ignored) { }
        items.sort(Comparator.comparing(Item::createdAt).reversed());
        Instant ok = lastOk != null ? lastOk : items.stream().filter(i -> "database".equals(i.kind())).map(Item::createdAt).findFirst().orElse(null);
        return new Status(enabled, dir.toString(), copyTo == null ? null : copyTo.toString(), schedule, keepDays, ok, lastBy, lastError, items);
    }

    /** The file for a download. Only names this service made are accepted. */
    public Path file(String name) {
        if (!NAME.matcher(name).matches()) throw new IllegalArgumentException("Unknown backup file.");
        Path p = dir.resolve(name).normalize();
        if (!p.startsWith(dir) || !Files.isRegularFile(p)) throw new NoSuchElementException("That backup file does not exist.");
        return p;
    }
}
