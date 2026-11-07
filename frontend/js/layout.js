function renderTopbar(activeInitial) {
  const header = document.createElement('div');
  header.className = 'topbar';
  header.innerHTML = `
    <div class="brand">DigiVault</div>
    <button class="profile-button" id="profileButton" title="Profile">${activeInitial || '•'}</button>
  `;
  document.body.prepend(header);
  document.getElementById('profileButton').addEventListener('click', () => {
    window.location.href = 'profile.html';
  });
}

function renderFooter() {
  const footer = document.createElement('footer');
  footer.innerHTML = `<a class="about-link" href="about.html">About Us</a>`;
  document.body.appendChild(footer);
}

export { renderTopbar, renderFooter };
