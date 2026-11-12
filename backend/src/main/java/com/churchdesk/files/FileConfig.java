package com.churchdesk.files;

import jakarta.servlet.MultipartConfigElement;
import org.springframework.boot.web.servlet.MultipartConfigFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.unit.DataSize;

/** Up to 10 MB per file. Set here so no change to application.properties is needed. */
@Configuration
public class FileConfig {
    @Bean
    MultipartConfigElement multipartConfigElement() {
        MultipartConfigFactory f = new MultipartConfigFactory();
        f.setMaxFileSize(DataSize.ofMegabytes(10));
        f.setMaxRequestSize(DataSize.ofMegabytes(30));
        return f.createMultipartConfig();
    }
}
