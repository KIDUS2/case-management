package com.churchdesk.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import com.churchdesk.dto.response.SmsLogItem;
import com.churchdesk.enums.AppointmentStatus;
import com.churchdesk.enums.EventType;
import com.churchdesk.enums.PartyRole;
import com.churchdesk.model.Appointment;
import com.churchdesk.model.AppUser;
import com.churchdesk.model.CaseEvent;
import com.churchdesk.model.CaseParty;
import com.churchdesk.model.ChurchCase;
import com.churchdesk.model.Person;
import com.churchdesk.model.SmsMessage;
import com.churchdesk.repository.AppointmentRepository;
import com.churchdesk.repository.CaseEventRepository;
import com.churchdesk.repository.ChurchCaseRepository;
import com.churchdesk.repository.SmsMessageRepository;
import com.churchdesk.util.Phones;

/**
 * Texts the person who brought the case with their case number (and appointment, if they have one). A text that
 * cannot be sent never stops a case from being registered: it is logged and the desk can send it again.
 */
@Service
public class SmsService {
    private static final Logger log = LoggerFactory.getLogger(SmsService.class);
    private static final DateTimeFormatter EN_DATE = DateTimeFormatter.ofPattern("EEE d MMM yyyy", Locale.ENGLISH);

    private final SmsGateway gateway;
    private final EmailSender email;
    private final SmsMessageRepository messages;
    private final AppointmentRepository appointments;
    private final CaseEventRepository events;
    private final ChurchCaseRepository cases;
    private final SettingService settings;
    private final AccessService access;

    public SmsService(SmsGateway gateway, EmailSender email, SmsMessageRepository messages, AppointmentRepository appointments,
                      CaseEventRepository events, ChurchCaseRepository cases, SettingService settings, AccessService access) {
        this.gateway = gateway; this.email = email; this.messages = messages; this.appointments = appointments; this.events = events;
        this.cases = cases; this.settings = settings; this.access = access;
    }

    public String mode() { return gateway.mode(); }
    public String emailMode() { return email.mode(); }

    /** Sends the case number to every complainant, by the channel the administrator chose. Returns how many messages went out. */
    @Transactional
    public int sendCaseNumber(ChurchCase c, String actor) { return sendCaseNumber(c, actor, null); }

    /** channel: SMS, EMAIL or BOTH; null means the administrator's setting. Whatever the person has on file is used. */
    @Transactional
    public int sendCaseNumber(ChurchCase c, String actor, String channel) {
        String ch = channel == null ? settings.get(AppointmentService.NOTIFY_CHANNEL, "SMS") : channel;
        boolean bySms = !"EMAIL".equals(ch), byMail = !"SMS".equals(ch);
        List<Appointment> appts = appointments.findByCaseIdAndStatus(c.getId(), AppointmentStatus.BOOKED);
        String text = compose(c.getCode(), appts);
        Map<String, Person> phones = new LinkedHashMap<>();
        Map<String, Person> mails = new LinkedHashMap<>();
        for (CaseParty p : c.getParties()) {
            if (p.getRole() != PartyRole.COMPLAINANT) continue;
            Person who = p.getPerson();
            String phone = Phones.toInternational(who.getPhone());
            if (phone != null) phones.putIfAbsent(phone, who);
            String mail = who.getEmail() == null ? "" : who.getEmail().trim();
            if (mail.matches("[^@\\s]+@[^@\\s]+\\.[^@\\s]+")) mails.putIfAbsent(mail.toLowerCase(Locale.ROOT), who);
        }
        int sent = 0, wanted = 0;
        if (bySms) { wanted += phones.size(); for (String phone : phones.keySet()) if (deliver(c.getId(), phone, text)) sent++; }
        if (byMail) { wanted += mails.size(); for (String to : mails.keySet()) if (deliverEmail(c.getId(), to, text)) sent++; }
        String how = bySms && byMail ? "text message / email" : byMail ? "email" : "text message";
        if (wanted > 0)
            events.save(new CaseEvent(c.getId(), null, EventType.SMS,
                    sent == wanted ? "Case number sent by " + how : "Case number could not be sent to everyone by " + how + " (" + sent + " of " + wanted + ")", actor));
        return sent;
    }

    /** Staff press "Send again" (by text, by email, or both). */
    @Transactional
    public int resend(Long caseId, String channel, AppUser actor) {
        if (channel != null && !channel.matches("SMS|EMAIL|BOTH")) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown channel");
        ChurchCase c = cases.findById(caseId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Case not found"));
        access.assertCanView(c, actor);
        int sent = sendCaseNumber(c, actor.getUsername(), channel);
        if (sent == 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "EMAIL".equals(channel)
                    ? "No email could be sent. Check that the person has a valid email address."
                    : "SMS".equals(channel) ? "No text could be sent. Check that the person has a valid mobile number (like 0911 23 45 67)."
                    : "Nothing could be sent. Check that the person has a valid mobile number or email address.");
        return sent;
    }

    @Transactional(readOnly = true)
    public List<SmsLogItem> history(Long caseId, AppUser actor) {
        ChurchCase c = cases.findById(caseId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Case not found"));
        access.assertCanView(c, actor);
        List<SmsLogItem> out = new ArrayList<>();
        for (SmsMessage m : messages.findByCaseIdOrderByIdDesc(caseId))
            out.add(new SmsLogItem(m.getChannel(), m.getPhone(), m.getBody(), m.getStatus(), m.getError(), m.getCreatedAt()));
        return out;
    }

    private boolean deliver(Long caseId, String phone, String text) {
        try {
            gateway.send(phone, text);
            messages.save(new SmsMessage(caseId, "SMS", phone, text, "log".equals(gateway.mode()) ? "LOGGED" : "SENT", null));
            return true;
        } catch (Exception e) {
            log.warn("SMS to {} failed: {}", phone, e.getMessage());
            messages.save(new SmsMessage(caseId, "SMS", phone, text, "FAILED", shorten(e)));
            return false;
        }
    }

    private boolean deliverEmail(Long caseId, String to, String text) {
        try {
            email.send(to, "Your case number", text);
            messages.save(new SmsMessage(caseId, "EMAIL", to, text, "log".equals(email.mode()) ? "LOGGED" : "SENT", null));
            return true;
        } catch (Exception e) {
            log.warn("Email to {} failed: {}", to, e.getMessage());
            messages.save(new SmsMessage(caseId, "EMAIL", to, text, "FAILED", shorten(e)));
            return false;
        }
    }

    private static String shorten(Exception e) { String err = String.valueOf(e.getMessage()); return err.length() > 480 ? err.substring(0, 480) : err; }

    /** The words of the text, in the language the administrator chose (English, Amharic, or both). */
    String compose(String code, List<Appointment> appts) {
        String lang = settings.get(AppointmentService.SMS_LANGUAGE, "BOTH");
        StringBuilder en = new StringBuilder("Church Case Desk: your case number is ").append(code).append('.');
        StringBuilder am = new StringBuilder("የጉዳይ ቁጥርዎ ").append(code).append(" ነው።");
        for (Appointment a : appts) {
            en.append(" Please come on ").append(a.getDate().format(EN_DATE)).append(", spot ").append(a.getSpotNo()).append('.');
            am.append(" ቀጠሮ፦ ").append(a.getDate()).append("፣ ቁጥር ").append(a.getSpotNo()).append("።");
        }
        return switch (lang) {
            case "EN" -> en.toString();
            case "AM" -> am.toString();
            default -> am + "\n" + en;
        };
    }
}
