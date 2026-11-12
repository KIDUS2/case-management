package com.churchdesk.cases;

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
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** The employee's photo and the documents kept in their file. */
@RestController
@RequestMapping("/api")
public class EmployeeMediaController {
    private static final String READ = "hasAnyRole('ADMIN','OFFICER','RECEPTION')";
    private static final String WRITE = "hasAnyRole('ADMIN','OFFICER')";
    private static final Map<String, String> PHOTO_TYPES = Map.of("jpg", "image/jpeg", "jpeg", "image/jpeg", "png", "image/png", "webp", "image/webp");
    private static final Set<String> DOC_TYPES = Set.of("pdf", "jpg", "jpeg", "png", "doc", "docx", "xls", "xlsx", "txt");
    private static final long MAX_PHOTO = 3L * 1024 * 1024;

    public record DocDto(Long id, String title, String kind, String originalName, String contentType, long sizeBytes, String uploadedBy, Instant uploadedAt) {}

    private final PersonRepository persons;
    private final EmployeeFileRepository docs;
    private final Path root;

    public EmployeeMediaController(PersonRepository persons, EmployeeFileRepository docs, @Value("${app.storage.dir:./uploads}") String dir) throws IOException {
        this.persons = persons; this.docs = docs;
        this.root = Path.of(dir).toAbsolutePath().normalize();
        Files.createDirectories(root);
    }

    // ---- photo ----

    @PostMapping("/employees/{id}/photo") @PreAuthorize(WRITE) @Transactional
    public void setPhoto(@PathVariable Long id, @RequestParam("file") MultipartFile file) throws IOException {
        Person p = person(id);
        if (file == null || file.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please choose a photo");
        String ext = ext(file.getOriginalFilename());
        if (!PHOTO_TYPES.containsKey(ext)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The photo must be a JPG, PNG or WEBP image");
        if (file.getSize() > MAX_PHOTO) throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "The photo is too big (3 MB at most)");
        String stored = "photo-" + UUID.randomUUID() + "." + ext;
        Files.copy(file.getInputStream(), root.resolve(stored), StandardCopyOption.REPLACE_EXISTING);
        if (p.getPhotoFile() != null) Files.deleteIfExists(root.resolve(p.getPhotoFile()).normalize());
        p.setPhotoFile(stored);
        persons.save(p);
    }

    @GetMapping("/employees/{id}/photo") @PreAuthorize(READ) @Transactional(readOnly = true)
    public ResponseEntity<Resource> photo(@PathVariable Long id) {
        Person p = person(id);
        if (p.getPhotoFile() == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No photo");
        Path f = safe(p.getPhotoFile());
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(PHOTO_TYPES.getOrDefault(ext(p.getPhotoFile()), "image/jpeg")))
                .cacheControl(CacheControl.maxAge(java.time.Duration.ofMinutes(5)).cachePrivate()).body(new FileSystemResource(f));
    }

    // ---- documents ----

    @GetMapping("/employees/{id}/documents") @PreAuthorize(WRITE) @Transactional(readOnly = true)
    public List<DocDto> documents(@PathVariable Long id) {
        person(id);
        return docs.findByPersonIdOrderByUploadedAtDesc(id).stream().map(this::dto).toList();
    }

    @PostMapping("/employees/{id}/documents") @ResponseStatus(HttpStatus.CREATED) @PreAuthorize(WRITE) @Transactional
    public DocDto addDocument(@PathVariable Long id, @RequestParam("file") MultipartFile file, @RequestParam(required = false) String title,
                              @RequestParam(required = false) String kind, Authentication auth) throws IOException {
        person(id);
        if (file == null || file.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please choose a file");
        String original = clean(file.getOriginalFilename());
        String ext = ext(original);
        if (!DOC_TYPES.contains(ext)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "That file type is not allowed. Use PDF, image, Word, Excel or text files.");
        String stored = "emp-" + UUID.randomUUID() + "." + ext;
        Files.copy(file.getInputStream(), root.resolve(stored), StandardCopyOption.REPLACE_EXISTING);
        EmployeeFile f = new EmployeeFile();
        f.setPersonId(id);
        f.setTitle(title == null || title.isBlank() ? original : title.trim().substring(0, Math.min(160, title.trim().length())));
        f.setKind(kind == null || kind.isBlank() ? null : kind.trim());
        f.setOriginalName(original); f.setStoredName(stored); f.setContentType(file.getContentType());
        f.setSizeBytes(file.getSize()); f.setUploadedBy(auth.getName());
        return dto(docs.save(f));
    }

    @GetMapping("/employee-files/{fileId}") @PreAuthorize(WRITE) @Transactional(readOnly = true)
    public ResponseEntity<Resource> download(@PathVariable Long fileId) {
        EmployeeFile f = docs.findById(fileId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));
        MediaType type;
        try { type = f.getContentType() == null ? MediaType.APPLICATION_OCTET_STREAM : MediaType.parseMediaType(f.getContentType()); }
        catch (Exception e) { type = MediaType.APPLICATION_OCTET_STREAM; }
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(f.getOriginalName(), StandardCharsets.UTF_8).build().toString())
                .contentType(type).body(new FileSystemResource(safe(f.getStoredName())));
    }

    @DeleteMapping("/employee-files/{fileId}") @ResponseStatus(HttpStatus.NO_CONTENT) @PreAuthorize(WRITE) @Transactional
    public void delete(@PathVariable Long fileId) throws IOException {
        EmployeeFile f = docs.findById(fileId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));
        Files.deleteIfExists(root.resolve(f.getStoredName()).normalize());
        docs.delete(f);
    }

    private DocDto dto(EmployeeFile f) {
        return new DocDto(f.getId(), f.getTitle(), f.getKind(), f.getOriginalName(), f.getContentType(), f.getSizeBytes(), f.getUploadedBy(), f.getUploadedAt());
    }
    private Person person(Long id) { return persons.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found")); }
    private Path safe(String stored) {
        Path p = root.resolve(stored).normalize();
        if (!p.startsWith(root) || !Files.exists(p)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "The file is missing from storage");
        return p;
    }
    private static String ext(String n) { return n != null && n.contains(".") ? n.substring(n.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT) : ""; }
    private static String clean(String n) {
        if (n == null || n.isBlank()) return "file";
        String base = n.replace('\\', '/');
        base = base.substring(base.lastIndexOf('/') + 1).replaceAll("[\\r\\n\"]", "_");
        return base.length() > 200 ? base.substring(base.length() - 200) : base;
    }
}
