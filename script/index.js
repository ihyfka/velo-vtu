const section = document.querySelectorAll("section");
const secObserver = new IntersectionObserver(section => {
  section.forEach(box => {
    if(box.isIntersecting) {
      box.target.classList.add("nowvisible");
    }
  })
}, {threshold: 0.25})
section.forEach(box => secObserver.observe(box))


const vanishingTxt = document.querySelector("#vanishing-text");
const text = [
  "Get Data that keeps You Going.",
  "Top Up. Talk More.",
  "Fuel Your Internet in seconds.",
  "Stay Connected.",
];
let index = 0, 
  charIndex = 0,
  isDeleting = false;
const speed = 100;
const deleteSpeed = 50;
const typingDelay = 3000;

function typeEffect() {
  const currentText = text[index];
  if(!isDeleting) { //typing
    vanishingTxt.textContent = currentText.substring(0, charIndex++);
    if(charIndex > currentText.length) {
      isDeleting = true;
      setTimeout(typeEffect, typingDelay);
      return;
    }
  }else { //deleting
    vanishingTxt.textContent = currentText.substring(0, charIndex--);
    if(charIndex < 0) {
      isDeleting = false;
      index = (index + 1) % text.length;
    }
  }
  setTimeout(typeEffect, isDeleting ? deleteSpeed: speed);
}
document.addEventListener("DOMContentLoaded", typeEffect);


