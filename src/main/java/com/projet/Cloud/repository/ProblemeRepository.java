package com.projet.Cloud.repository;

import com.projet.Cloud.model.Probleme;
import com.projet.Cloud.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProblemeRepository extends JpaRepository<Probleme, Long> {
    List<Probleme> findByStatus(String status);
    List<Probleme> findByUser(User user);
    Optional<Probleme> findByFirebaseId(String firebaseId);
}
