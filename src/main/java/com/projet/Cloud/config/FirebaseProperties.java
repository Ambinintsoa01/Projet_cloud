package com.projet.Cloud.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "firebase")

public class FirebaseProperties {

    private Connection connection;
    private String host;
    private int port;
    private Credentials credentials;

    public static class Connection {
        private int timeout;

        public int getTimeout() {
            return timeout;
        }

        public void setTimeout(int timeout) {
            this.timeout = timeout;
        }
    }


    public Connection getConnection() {
        return connection;
    }


    public void setConnection(Connection connection) {
        this.connection = connection;
    }


    public String getHost() {
        return host;
    }


    public void setHost(String host) {
        this.host = host;
    }


    public int getPort() {
        return port;
    }


    public void setPort(int port) {
        this.port = port;
    }


    public Credentials getCredentials() {
        return credentials;
    }


    public void setCredentials(Credentials credentials) {
        this.credentials = credentials;
    }


    
    public static class Credentials {
        private String path;

        public String getPath() {
            return path;
        }

        public void setPath(String path) {
            this.path = path;
        }
    }
}
