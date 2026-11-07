import { requireAuthOrRedirect, getUser } from './api.js';
import { renderTopbar, renderFooter } from './layout.js';

requireAuthOrRedirect();

const user = getUser();
const initial = user && user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U';
renderTopbar(initial);
renderFooter();

document.querySelectorAll('.dashboard-tile').forEach((tile) => {
  tile.addEventListener('click', () => {
    window.location.href = tile.dataset.href;
  });
});
