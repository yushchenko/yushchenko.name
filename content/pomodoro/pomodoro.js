$(function() {

      var started = null,
          interval = 25,
          timer = $('#timer'),
          crankSound = $('#crank').get(0),
          tickingSound = $('#ticking').get(0),
          bellSound = $('#bell').get(0);

      $('body').click(function() {

          if (started) {
              return;
          }

          started = new Date();
          timer.html(interval);
          crankSound.play();
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
              tickingSound.pause();
              bellSound.play();
              return;
          }

          timer.html(m);

      }, 500);
});