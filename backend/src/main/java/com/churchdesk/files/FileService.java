package com.churchdesk.files;

import com.churchdesk.cases.*;
import com.churchdesk.user.AppUser;
import com.churchdesk.user.Role;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class FileService {
    private static final Set<String> ALLOWED = Set.of("pdf", "jpg", "jpeg", "png", "doc", "docx", "xls", "xlsx", "txt");

    private final CaseFileRepository files;
    private final ChurchCaseRepository cases;
    private final CaseEventRepository events;
    private final AccessService access;
    private final ChurchInquiryRepository inquiries;
    private final Path root;

    public FileService(CaseFileRepository files, ChurchCaseRepository cases, CaseEventRepository events, AccessService access, ChurchInquiryRepository inquiries,
                       @Value("${app.storage.dir:./uploads}") String dir) throws IOException {
        this.files = files; this.cases = cases; this.events = events; this.access = access; this.inquiries = inquiries;
        this.root = Path.of(dir).toAbsolutePath().normalize();
        Files.createDirectories(root);
    }

    @Transactional
    public CaseDtos.FileDto store(Long caseId, Long issueId, MultipartFile file, AppUser actor) throws IOException {
        return store(caseId, issueId, null, null, file, actor);
    }

    @Transactional
    public CaseDtos.FileDto store(Long caseId, Long issueId, Long inquiryId, String stage, MultipartFile file, AppUser actor) throws IOException {
        ChurchCase c = cases.findById(caseId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Case not found"));
        access.assertCanView(c, actor);
        if (issueId != null && c.getIssues().stream().noneMatch(i -> i.getId().equals(issueId)))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "That issue is not part of this case");
        if (inquiryId != null && inquiries.findById(inquiryId).filter(q -> q.getCaseId().equals(caseId)).isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "That comment is not part of this case");
        if (file == null || file.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please choose a file");
        String original = cleanName(file.getOriginalFilename());
        String ext = original.contains(".") ? original.substring(original.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT) : "";
        if (!ALLOWED.contains(ext))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "That file type is not allowed. Use PDF, image, Word, Excel or text files.");
        String stored = UUID.randomUUID() + "." + ext;
        Files.copy(file.getInputStream(), root.resolve(stored), StandardCopyOption.REPLACE_EXISTING);

        CaseFile f = new CaseFile();
        f.setCaseId(caseId); f.setIssueId(issueId); f.setInquiryId(inquiryId); f.setStage(stage); f.setOriginalName(original); f.setStoredName(stored);
        f.setContentType(file.getContentType()); f.setSizeBytes(file.getSize()); f.setUploadedBy(actor.getUsername());
        f = files.save(f);
        events.save(new CaseEvent(caseId, null, EventType.FILE, "File added: " + original + (issueId == null ? "" : " (to issue " + (issueNo(c, issueId)) + ")"), actor.getUsername()));
        return new CaseDtos.FileDto(f.getId(), f.getIssueId(), f.getInquiryId(), f.getStage(), f.getOriginalName(), f.getContentType(), f.getSizeBytes(), f.getUploadedBy(), f.getUploadedAt());
    }

    public record Download(Resource resource, String name, String contentType) {}

    @Transactional(readOnly = true)
    public Download load(Long id, AppUser actor) {
        CaseFile f = files.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));
        ChurchCase c = cases.findById(f.getCaseId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Case not found"));
        access.assertCanView(c, actor);
        Path p = root.resolve(f.getStoredName()).normalize();
        if (!p.startsWith(root) || !Files.exists(p)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "The file is missing from storage");
        return new Download(new FileSystemResource(p), f.getOriginalName(), f.getContentType());
    }

    @Transactional
    public void delete(Long id, AppUser actor) throws IOException {
        if (actor.getRole() != Role.ADMIN && actor.getRole() != Role.OFFICER)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only an officer or admin can remove files");
        CaseFile f = files.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));
        Files.deleteIfExists(root.resolve(f.getStoredName()).normalize());
        events.save(new CaseEvent(f.getCaseId(), null, EventType.FILE, "File removed: " + f.getOriginalName(), actor.getUsername()));
        files.delete(f);
    }

    private static int issueNo(ChurchCase c, Long issueId) {
        for (int k = 0; k < c.getIssues().size(); k++) if (c.getIssues().get(k).getId().equals(issueId)) return k + 1;
        return 0;
    }

    private static String cleanName(String n) {
        if (n == null || n.isBlank()) return "file";
        String base = n.replace('\\', '/');
        base = base.substring(base.lastIndexOf('/') + 1).replaceAll("[\\r\\n\"]", "_");
        return base.length() > 200 ? base.substring(base.length() - 200) : base;
    }
}
