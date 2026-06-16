## Respuestas

### Pregunta 1
El token no debería estar en el código ni en el frontend. En Frappe lo guardaría en `System Settings` o en `site_config.json`, donde queda protegido. Luego en Python lo leo con `frappe.conf` o desde ese DocType de configuración. Así puedo usarlo en los headers de la petición sin exponerlo en el repo.

---

### Pregunta 2
Si la API falla, probablemente el usuario no vería datos o la página quedaría cargando sin explicación. Para mejorarlo, capturaría el error en el backend con `try/except` y devolvería un mensaje claro. En el frontend mostraría una alerta tipo “No se pudo conectar con el servicio, intenta más tarde”.

---

### Pregunta 3
La idea es que el estado del stock siempre se recalcula cuando se guarda el documento. Si el stock es mayor a 0, se quita la etiqueta “Sin Stock”; si es 0, se agrega. Esto se debe validar en cada guardado para evitar inconsistencias, idealmente en el hook `validate`.
