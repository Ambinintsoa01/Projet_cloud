package com.projet.Cloud.repository;

import com.projet.Cloud.model.SignalementType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SignalementTypeRepository extends JpaRepository<SignalementType, Long> {
    Optional<SignalementType> findByLibelle(String libelle);
}
