import * as bootstrap from 'bootstrap';

const buttons = document.querySelectorAll('[data-panel]'),
panels = document.querySelectorAll('.side-panel');
let tooltipList;

function mostrarPanel(panelId) {
  panels.forEach(panel => {
    panel.style.display = panel.id === panelId ? 'block' : 'none';
  });
  OcultarTooltips();
}

buttons.forEach(button => {
  button.addEventListener('click', () => {
    const panelId = button.getAttribute('data-panel');
    mostrarPanel(panelId);
  });
});

document.querySelectorAll(".btn-close").forEach(button => {
  button.addEventListener("click", (event) => {
    const panelId = event.target.getAttribute("data-close");
    document.getElementById(panelId).style.display = "none";
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
});

function OcultarTooltips() {
  tooltipList.forEach(tooltip => tooltip.hide());
}