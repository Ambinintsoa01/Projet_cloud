package com.projet.Cloud.service;

import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import com.projet.Cloud.model.Signalement;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

@Service
@RequiredArgsConstructor
@Slf4j
public class PushNotificationService {

    private static final Map<String, StatusMessage> STATUS_MESSAGES = Map.ofEntries(
            Map.entry("nouveau", new StatusMessage("📝 Signalement enregistré", "Votre signalement %s vient d'être créé. Nous allons le traiter.")),
            Map.entry("en_cours", new StatusMessage("⚙️ Signalement en cours", "Votre signalement %s est en cours de traitement.")),
            Map.entry("terminé", new StatusMessage("✅ Signalement terminé", "Votre signalement %s a été traité et terminé."))
    );

    private final Firestore firestore;
    private final FirebaseMessaging firebaseMessaging;

    public void sendStatusChangeNotification(Signalement signalement, String previousStatus) {
        if (signalement == null) {
            log.warn("⚠️ Tentative d'envoi de notification avec un signalement nul");
            return;
        }

        if (signalement.getUser() == null) {
            log.warn("⚠️ Signalement {} sans utilisateur, pas de notification", signalement.getId());
            return;
        }

        Long userId = signalement.getUser().getId();
        if (userId == null) {
            log.warn("⚠️ Utilisateur sans ID pour le signalement {}", signalement.getId());
            return;
        }

        try {
            DocumentSnapshot userDoc = firestore.collection("users")
                    .document(userId.toString())
                    .get()
                    .get();

            if (!userDoc.exists()) {
                log.warn("⚠️ Aucun document Firestore trouvé pour l'utilisateur {}", userId);
                return;
            }

            String fcmToken = userDoc.getString("fcmToken");
            if (StringUtils.isBlank(fcmToken)) {
                log.warn("⚠️ Aucun token FCM pour l'utilisateur {}", userId);
                return;
            }

            String status = signalement.getStatus();
            StatusMessage statusMessage = getStatusMessage(status);

            String title = statusMessage.title();
            String description = Optional.ofNullable(signalement.getDescription())
                    .map(String::trim)
                    .filter(StringUtils::isNotBlank)
                    .map(desc -> desc.length() > 80 ? desc.substring(0, 80) + "..." : desc)
                    .orElse("signalement");

            Notification notification = Notification.builder()
                    .setTitle(title)
                    .setBody(statusMessage.format(description))
                    .build();

            Message message = Message.builder()
                    .setToken(fcmToken)
                    .setNotification(notification)
                    .putData("signalementId", Objects.toString(signalement.getId(), ""))
                    .putData("userId", userId.toString())
                    .putData("status", Objects.toString(status, ""))
                    .putData("previousStatus", Objects.toString(previousStatus, ""))
                    .putData("latitude", Optional.ofNullable(signalement.getLatitude()).map(Object::toString).orElse(""))
                    .putData("longitude", Optional.ofNullable(signalement.getLongitude()).map(Object::toString).orElse(""))
                    .putData("description", description)
                    .build();

            firebaseMessaging.sendAsync(message).get();
            log.info("✅ Notification push envoyée à user={} pour signalement {} status={}", userId, signalement.getId(), status);
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
            log.warn("❌ Envoi notification interrompu pour signalement {}", signalement.getId(), interrupted);
        } catch (ExecutionException e) {
            log.warn("❌ Échec de l'envoi de la notification pour signalement {}: {}", signalement.getId(), e.getMessage(), e);
        }
    }

    private StatusMessage getStatusMessage(String status) {
        if (status == null) {
            return StatusMessage.defaultMessage();
        }
        return STATUS_MESSAGES.getOrDefault(status.toLowerCase(Locale.ROOT), StatusMessage.defaultMessage());
    }

    private record StatusMessage(String title, String template) {
        String format(String details) {
            return String.format(template, details);
        }

        static StatusMessage defaultMessage() {
            return new StatusMessage("🔔 Mise à jour", "Le statut de votre signalement %s vient de changer.");
        }
    }
}
