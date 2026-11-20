package com.churchdesk.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import com.churchdesk.enums.AppointmentStatus;
import com.churchdesk.model.Appointment;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByCaseIdAndStatus(Long caseId, AppointmentStatus status);

    List<Appointment> findByCaseIdOrderByDateDescSpotNoAsc(Long caseId);

    Optional<Appointment> findFirstByCaseIdAndDateAndStatusNot(Long caseId, LocalDate date, AppointmentStatus status);

    @Query("select a.date, count(a) from Appointment a where a.date between :from and :to and a.status <> :cancelled group by a.date")
    List<Object[]> countByDay(@Param("from") LocalDate from, @Param("to") LocalDate to, @Param("cancelled") AppointmentStatus cancelled);

    @Query("select a.spotNo from Appointment a where a.date = :day and a.status <> :cancelled order by a.spotNo")
    List<Integer> takenSpots(@Param("day") LocalDate day, @Param("cancelled") AppointmentStatus cancelled);
}
