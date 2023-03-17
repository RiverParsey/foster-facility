const siteList = document.querySelector('.menu__list');
const menuToggle = document.querySelector('.menu-toggle');

menuToggle.addEventListener('click', function() {
  if (siteList.classList.contains('menu__list__closed')) {
    siteList.classList.remove('menu__list__closed');
    siteList.classList.add('menu__list__opened');
  } else {
    siteList.classList.add('menu__list--closed');
    siteList.classList.remove('menu__list--opened');
  }
})