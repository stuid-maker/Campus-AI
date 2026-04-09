package com.campusai.app.core.security

import org.mindrot.jbcrypt.BCrypt

object PasswordHasher {
    fun hash(raw: String): String = BCrypt.hashpw(raw, BCrypt.gensalt(12))
    fun verify(raw: String, hash: String): Boolean = BCrypt.checkpw(raw, hash)
}
