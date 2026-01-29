// Este script conecta el botón de login con el modal
window.addEventListener('DOMContentLoaded', () => {
  const loginModal = document.querySelector('login-modal');
  window.addEventListener('show-login-modal', () => {
    if (loginModal) loginModal.show();
  });
});
