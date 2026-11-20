package com.churchdesk.enums;

/**
 * ADMIN: everything, plus configuration. OFFICER: handles and resolves cases, marks court.
 * RECEPTION: registers visitors at the door and refers issues. DEPARTMENT: sees and resolves only the issues sent to their own department.
 * SUBCITY: a sub-city office. Submits cases for churches in its own sub-city and follows only those cases.
 * SERA_ASKIYAJIE: manages the departments. Sees every case and takes over issues a department cannot finish.
 * PAPAS: the head of the diocese. Sees every case and gives the final decision on issues passed up to him.
 */
public enum Role {
    ADMIN, OFFICER, RECEPTION, DEPARTMENT, SUBCITY, SERA_ASKIYAJIE, PAPAS;

    /** Sera Askiyajie and Papas. */
    public boolean isLeadership() { return this == SERA_ASKIYAJIE || this == PAPAS; }

    /** The people at the diocese who can take decisions about a case. */
    public boolean isDiocese() { return this == ADMIN || this == OFFICER || isLeadership(); }
}
