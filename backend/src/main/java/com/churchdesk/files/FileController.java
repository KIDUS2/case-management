package com.churchdesk.files;

import com.churchdesk.cases.CaseDtos.FileDto;
import com.churchdesk.user.CurrentUser;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api")
public class FileController {
    private final FileService service;
    private final CurrentUser current;

    public FileController(FileService service, CurrentUser current) { this.service = service; this.current = current; }

    @PostMapping("/cases/{id}/files") @ResponseStatus(HttpStatus.CREATED)
    public FileDto upload(@PathVariable Long id, @RequestParam("file") MultipartFile file, Authentication auth) throws IOException {
        return service.store(id, file, current.get(auth));
    }

    @GetMapping("/files/{id}")
    public ResponseEntity<Resource> download(@PathVariable Long id, Authentication auth) {
        FileService.Download d = service.load(id, current.get(auth));
        MediaType type;
        try { type = d.contentType() == null ? MediaType.APPLICATION_OCTET_STREAM : MediaType.parseMediaType(d.contentType()); }
        catch (Exception e) { type = MediaType.APPLICATION_OCTET_STREAM; }
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(d.name(), StandardCharsets.UTF_8).build().toString())
                .contentType(type).body(d.resource());
    }

    @DeleteMapping("/files/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, Authentication auth) throws IOException { service.delete(id, current.get(auth)); }
}
