function mostrarFechaHora() {
    var fecha = new Date();
    var dia = fecha.getDate();
    var mes = fecha.getMonth() + 1;
    var anio = fecha.getFullYear();
    var hora = fecha.getHours();
    var minutos = fecha.getMinutes();
    var segundos = fecha.getSeconds();
    var ampm = (hora >= 12) ? "PM" : "AM";
    hora = (hora > 12) ? hora - 12 : hora;
    hora = (hora < 10) ? "0" + hora : hora;
    minutos = (minutos < 10) ? "0" + minutos : minutos;
    segundos = (segundos < 10) ? "0" + segundos : segundos;
    var fechaHora = dia + "/" + mes + "/" + anio + " " + hora + ":" + minutos + ":" + segundos + " " + ampm;
    document.getElementById("fecha-hora").innerHTML = fechaHora;
    setTimeout(mostrarFechaHora, 1000);
}


