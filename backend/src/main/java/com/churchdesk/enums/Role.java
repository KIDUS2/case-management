package com.churchdesk.enums;

/**
 * ADMIN: everything, plus configuration. OFFICER: handles and resolves cases, marks court.
 * RECEPTION: registers visitors at the door and refers issues. DEPARTMENT: sees and resolves only the issues sent to their own department.
 * SUBCITY: a sub-city office. Submits cases for churches in its own sub-city and follows only those cases.
 */
public enum Role { ADMIN, OFFICER, RECEPTION, DEPARTMENT, SUBCITY }
