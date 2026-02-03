package com.projet.Cloud.util;


import jakarta.servlet.http.HttpServletRequest;

public final class NetworkUtil {
    private NetworkUtil() {}

    public static String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isEmpty()) return xff.split(",")[0].trim();
        return request.getRemoteAddr();
    }
}
