(() => {
  if (location.protocol === 'file:') return;
  const button = document.getElementById('bInstall');
  const help = document.getElementById('installHelp');
  if (!button || !help) return;

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch(error => {
      console.warn('Offline support is unavailable:', error);
    });
  }

  const installed = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if (installed()) return;

  let installPrompt;
  button.hidden = false;
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
  });
  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    button.hidden = true;
    help.hidden = true;
  });

  button.addEventListener('click', async () => {
    if (installPrompt) {
      const prompt = installPrompt;
      installPrompt = null;
      await prompt.prompt();
      await prompt.userChoice;
      return;
    }
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    help.textContent = ios
      ? 'In Safari, tap Share, then Add to Home Screen.'
      : 'Open your browser menu and choose Install app or Add to Home screen.';
    help.hidden = false;
  });
})();
