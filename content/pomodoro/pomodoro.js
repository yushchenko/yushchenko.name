$(function() {

      var started = null,
          interval = 25,
          timer = $('#timer'),
          tickingSound = $('#ticking').get(0);

      $('body').click(function() {

          if (started) {
              return;
          }

          started = new Date();
          timer.html(interval);
          tickingSound.play();
          
      });

      setInterval(function() {

          if (!started) {
              return;
          }

          var t = new Date(),
              passed = t - started,
              m = Math.ceil(interval - passed/60000);

          if (passed > interval*60000) {
              started = null;
              timer.html('Start');
              return;
          }

          timer.html(m);

      }, 500);
});