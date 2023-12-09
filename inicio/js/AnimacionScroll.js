window.addEventListener('scroll', function() {
  let caja = document.getElementById('caja');
  let caja1 = document.getElementById('caja1');
  let caja2 = document.getElementById('caja2');
  let caja3 = document.getElementById('caja3');
  let caja4 = document.getElementById('caja4');
  let caja5 = document.getElementById('caja5');
  let caja6 = document.getElementById('caja6');
  let caja7 = document.getElementById('caja7');
  let caja8 = document.getElementById('caja8');
  let screenSize = window.innerHeight;

  if (caja.getBoundingClientRect().top < screenSize) {
    caja.classList.add('visible');
  } else {
    caja.classList.remove('visible');
  }

  if (caja1.getBoundingClientRect().top < screenSize) {
    caja1.classList.add('visible');
  } else {
    caja1.classList.remove('visible');
  }

  if (caja2.getBoundingClientRect().top < screenSize) {
    caja2.classList.add('visible');
  } else {
    caja2.classList.remove('visible');
  }

  if (caja3.getBoundingClientRect().top < screenSize) {
    caja3.classList.add('visible');
  } else {
    caja3.classList.remove('visible');
  }

  if (caja4.getBoundingClientRect().top < screenSize) {
    caja4.classList.add('visible');
  } else {
    caja4.classList.remove('visible');
  }

  if (caja5.getBoundingClientRect().top < screenSize) {
    caja5.classList.add('visible');
  } else {
    caja5.classList.remove('visible');
  }

  if (caja6.getBoundingClientRect().top < screenSize) {
    caja6.classList.add('visible');
  } else {
    caja6.classList.remove('visible');
  }

  if (caja7.getBoundingClientRect().top < screenSize) {
    caja7.classList.add('visible');
  } else {
    caja7.classList.remove('visible');
  }

  if (caja8.getBoundingClientRect().top < screenSize) {
    caja8.classList.add('visible');
  } else {
    caja8.classList.remove('visible');
  }
});

