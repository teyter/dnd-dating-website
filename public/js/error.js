document.addEventListener('DOMContentLoaded', function () {
  var eyes = document.querySelectorAll('.error-500 .eye');

  if (eyes.length > 0) {
    document.addEventListener('mousemove', function (event) {
      eyes.forEach(function (eye) {
        var rect = eye.getBoundingClientRect();
        var x = rect.left + rect.width / 2;
        var y = rect.top + rect.height / 2;

        var rad = Math.atan2(event.clientX - x, event.clientY - y);
        var rot = rad * (180 / Math.PI) * -1 + 180;

        eye.style.transform = 'rotate(' + rot + 'deg)';
        eye.style.webkitTransform = 'rotate(' + rot + 'deg)';
      });
    });
  }
});
