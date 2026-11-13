package com.churchdesk.controller;

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
import com.churchdesk.dto.common.Download;
import com.churchdesk.dto.response.CaseFileDto;
import com.churchdesk.security.CurrentUser;
import com.churchdesk.service.FileService;

@RestController
@RequestMapping("/api")
public class FileController {
    private final FileService service;
    private final CurrentUser current;

    public FileController(FileService service, CurrentUser current) { this.service = service; this.current = current; }

    @PostMapping("/cases/{id}/files") @ResponseStatus(HttpStatus.CREATED)
    public CaseFileDto upload(@PathVariable Long id, @RequestParam("file") MultipartFile file,
                          @RequestParam(value = "issueId", required = false) Long issueId,
                          @RequestParam(value = "inquiryId", required = false) Long inquiryId,
                          @RequestParam(value = "stage", required = false) String stage, Authentication auth) throws IOException {
        if (stage != null && !stage.equals("REQUEST") && !stage.equals("FINDING"))
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown file stage");
        return service.store(id, issueId, inquiryId, inquiryId == null ? null : stage, file, current.get(auth));
    }

    @GetMapping("/files/{id}")
    public ResponseEntity<Resource> download(@PathVariable Long id, Authentication auth) {
        Download d = service.load(id, current.get(auth));
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
