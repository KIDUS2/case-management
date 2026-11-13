package com.churchdesk.church;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/** One church's profile: its details, its place on the map and its documents (the carta and others). */
@RestController
@RequestMapping("/api")
public class ChurchProfileController {
    private static final String READ = "hasAnyRole('ADMIN','OFFICER','RECEPTION')";
    private static final String WRITE = "hasAnyRole('ADMIN','OFFICER')";
    private static final Set<String> KINDS = Set.of("CARTA", "MAP", "LETTER", "PHOTO", "OTHER");
    private static final Set<String> TYPES = Set.of("pdf", "jpg", "jpeg", "png", "webp", "doc", "docx", "xls", "xlsx", "txt");

    public record ChurchProfile(Long id, String name, String subCity, String address, String phone, String email, String patronSaint, Integer establishedYear,
                                String landArea, String cartaNumber, Double latitude, Double longitude, String notes, boolean hasCarta) {}
    public record ProfileRequest(@Size(max = 255) String address, @Size(max = 40) String phone, @Size(max = 120) String email, @Size(max = 120) String patronSaint,
                                 @Min(300) @Max(2100) Integer establishedYear, @Size(max = 60) String landArea, @Size(max = 80) String cartaNumber,
                                 @DecimalMin("-90") @DecimalMax("90") Double latitude, @DecimalMin("-180") @DecimalMax("180") Double longitude,
                                 @Size(max = 4000) String notes) {}
    public record FileDto(Long id, String kind, String title, String originalName, String contentType, long sizeBytes, String uploadedBy, Instant uploadedAt) {}

    private final ChurchRepository churches;
    private final ChurchFileRepository files;
    private final Path root;

    public ChurchProfileController(ChurchRepository churches, ChurchFileRepository files, @Value("${app.storage.dir:./uploads}") String dir) throws IOException {
        this.churches = churches; this.files = files;
        this.root = Path.of(dir).toAbsolutePath().normalize();
        Files.createDirectories(root);
    }

    @GetMapping("/churches/{id}/profile") @PreAuthorize(READ) @Transactional(readOnly = true)
    public ChurchProfile profile(@PathVariable Long id) { return dto(find(id)); }

    @PutMapping("/churches/{id}/profile") @PreAuthorize(WRITE) @Transactional
    public ChurchProfile save(@PathVariable Long id, @Valid @RequestBody ProfileRequest r) {
        Church c = find(id);
        if ((r.latitude() == null) != (r.longitude() == null)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter both latitude and longitude, or leave both empty");
        c.setAddress(blank(r.address())); c.setPhone(blank(r.phone())); c.setEmail(blank(r.email())); c.setPatronSaint(blank(r.patronSaint()));
        c.setEstablishedYear(r.establishedYear()); c.setLandArea(blank(r.landArea())); c.setCartaNumber(blank(r.cartaNumber()));
        c.setLatitude(r.latitude()); c.setLongitude(r.longitude()); c.setNotes(blank(r.notes()));
        return dto(c);
    }

    @GetMapping("/churches/{id}/files") @PreAuthorize(READ) @Transactional(readOnly = true)
    public List<FileDto> list(@PathVariable Long id) {
        find(id);
        return files.findByChurchIdOrderByUploadedAtDesc(id).stream().map(this::fileDto).toList();
    }

    @PostMapping("/churches/{id}/files") @ResponseStatus(HttpStatus.CREATED) @PreAuthorize(WRITE) @Transactional
    public FileDto add(@PathVariable Long id, @RequestParam("file") MultipartFile file, @RequestParam(required = false) String title,
                       @RequestParam(defaultValue = "OTHER") String kind, Authentication auth) throws IOException {
        find(id);
        if (file == null || file.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please choose a file");
        String k = kind.toUpperCase(Locale.ROOT);
        if (!KINDS.contains(k)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown kind of document");
        String original = clean(file.getOriginalFilename());
        String ext = original.contains(".") ? original.substring(original.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT) : "";
        if (!TYPES.contains(ext)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "That file type is not allowed. Use PDF, image, Word, Excel or text files.");
        String stored = "church-" + UUID.randomUUID() + "." + ext;
        Files.copy(file.getInputStream(), root.resolve(stored), StandardCopyOption.REPLACE_EXISTING);
        ChurchFile f = new ChurchFile();
        f.setChurchId(id); f.setKind(k);
        f.setTitle(title == null || title.isBlank() ? original : title.trim().substring(0, Math.min(160, title.trim().length())));
        f.setOriginalName(original); f.setStoredName(stored); f.setContentType(file.getContentType());
        f.setSizeBytes(file.getSize()); f.setUploadedBy(auth.getName());
        return fileDto(files.save(f));
    }

    @GetMapping("/church-files/{fileId}") @PreAuthorize(READ) @Transactional(readOnly = true)
    public ResponseEntity<Resource> download(@PathVariable Long fileId) {
        ChurchFile f = files.findById(fileId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));
        MediaType type;
        try { type = f.getContentType() == null ? MediaType.APPLICATION_OCTET_STREAM : MediaType.parseMediaType(f.getContentType()); }
        catch (Exception e) { type = MediaType.APPLICATION_OCTET_STREAM; }
        Path p = root.resolve(f.getStoredName()).normalize();
        if (!p.startsWith(root) || !Files.exists(p)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "The file is missing from storage");
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(f.getOriginalName(), StandardCharsets.UTF_8).build().toString())
                .contentType(type).body(new FileSystemResource(p));
    }

    @DeleteMapping("/church-files/{fileId}") @ResponseStatus(HttpStatus.NO_CONTENT) @PreAuthorize(WRITE) @Transactional
    public void delete(@PathVariable Long fileId) throws IOException {
        ChurchFile f = files.findById(fileId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));
        Files.deleteIfExists(root.resolve(f.getStoredName()).normalize());
        files.delete(f);
    }

    private ChurchProfile dto(Church c) {
        boolean carta = files.findByChurchIdOrderByUploadedAtDesc(c.getId()).stream().anyMatch(f -> "CARTA".equals(f.getKind()));
        return new ChurchProfile(c.getId(), c.getName(), c.getSubCity(), c.getAddress(), c.getPhone(), c.getEmail(), c.getPatronSaint(), c.getEstablishedYear(),
                c.getLandArea(), c.getCartaNumber(), c.getLatitude(), c.getLongitude(), c.getNotes(), carta);
    }
    private FileDto fileDto(ChurchFile f) {
        return new FileDto(f.getId(), f.getKind(), f.getTitle(), f.getOriginalName(), f.getContentType(), f.getSizeBytes(), f.getUploadedBy(), f.getUploadedAt());
    }
    private Church find(Long id) { return churches.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Church not found")); }
    private static String blank(String s) { return s == null || s.isBlank() ? null : s.trim(); }
    private static String clean(String n) {
        if (n == null || n.isBlank()) return "file";
        String base = n.replace('\\', '/');
        base = base.substring(base.lastIndexOf('/') + 1).replaceAll("[\\r\\n\"]", "_");
        return base.length() > 200 ? base.substring(base.length() - 200) : base;
    }
}
