import '../layout/layout-engine.js'

/** Placeholder alerts for decorative toolbar (no real actions). */
const FAKE_TOOLBAR_ALERTS = ['View (demo)', 'Archive (demo)', 'Lux (demo)']

document.querySelectorAll('.fake-toolbar__btn').forEach((btn, index) => {
  btn.addEventListener('click', () => {
    alert(FAKE_TOOLBAR_ALERTS[index] ?? 'Demo')
  })
})
