# Spanish Tatami Discord Bot
Spanish Tatami es un bot para Discord que trata de ayudar con los tiempos de respaen de los MVPs en Ragnarok Online.

## Features
- Muestra información de MVPs (basado en RMS)
- Crear una lista de MVPs que actualmente están bajo seguimiento por el jugador
- Crear un recordatorio que avisará (si previamente se ha usado el comando $set-reminder-channel) cuando quede poco para que reaparezca un MVP bajo seguimiento.

## Commands
```
$help
$info <bossname>
$mvp add <bossname>
$mvp list
$mvp clear
```

### $help
Para ver una lista con todos los comandos disponibles.

### $info "bossname"
![info](img/info.PNG)


Para ver información sobre un MVP específico.

### $mvp add "bossname" [HH:MM]
![info](img/add.PNG)


Para agregar un MVP a la lista de seguimiento. 
Opcional: puedes especificar la hora (formato 24h) en que murió el MVP. Ejemplo: $mvp add TestMob 18:07.


![info](img/remind.PNG)


Esto también genera automáticamente los recordatorios para avisar cuando el MVP vaya a respawnear.

### $mvp list
![info](img/list.PNG)


Para ver una lista de los MVPs que actualmente estan bajo seguimiento.

#### $mvp clear
Limpia la lista de seguimiento de los MVPs.
Este comando debería usarse **SOLO** cuando el server haya sufrido un reinicio (caída, mantenimiento, etc.)

> Spanish Tatami MVP Tracker Discord Bot esta basado en Sprinkles de 🌺 Xaikyu 🌺#3108 y Jeee#0016, actualizado y traducido por Sarjador.