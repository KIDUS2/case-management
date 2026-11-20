package com.churchdesk.service;

/** Something that can deliver a text message. Throws if the message could not be sent. */
public interface SmsGateway {
    /** "log" when messages are only written to the log, "http" when they go to a real SMS provider. */
    String mode();

    void send(String phone, String text) throws Exception;
}
