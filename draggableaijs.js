    (function(){
      const draggableainameFloatButton = document.getElementById('draggableainameFloatButton');
      const draggableainameIframe = document.getElementById('draggableainameIframe');

      draggableainameFloatButton.addEventListener('click', function(){
        draggableainameIframe.style.display = 'block';
        draggableainameFloatButton.style.display = 'none';
      });

      window.addEventListener('message', function(e){
        if(e && e.data && e.data.type === 'draggableainame-close-iframe'){
          draggableainameIframe.style.display = 'none';
          draggableainameFloatButton.style.display = 'inline-block';
        }
      });

      let draggableainameIsDragging = false;
      let draggableainameStartX = 0, draggableainameStartY = 0;
      let draggableainameOffsetX = 0, draggableainameOffsetY = 0;

      const draggableainameStartDrag = function(ev){
        ev.preventDefault();
        draggableainameIsDragging = false;

        const point = ev.touches ? ev.touches[0] : ev;
        draggableainameStartX = point.clientX;
        draggableainameStartY = point.clientY;

        draggableainameOffsetX = draggableainameFloatButton.offsetLeft;
        draggableainameOffsetY = draggableainameFloatButton.offsetTop;

        document.addEventListener('mousemove', draggableainameOnMove);
        document.addEventListener('mouseup', draggableainameStopDrag);
        document.addEventListener('touchmove', draggableainameOnMove, { passive: false });
        document.addEventListener('touchend', draggableainameStopDrag);
      };

      const draggableainameOnMove = function(ev){
        ev.preventDefault();
        const point = ev.touches ? ev.touches[0] : ev;
        const dx = point.clientX - draggableainameStartX;
        const dy = point.clientY - draggableainameStartY;

        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) draggableainameIsDragging = true;

        if (draggableainameIsDragging) {
          let newX = draggableainameOffsetX + dx;
          let newY = draggableainameOffsetY + dy;

          const maxX = window.innerWidth - draggableainameFloatButton.offsetWidth;
          const maxY = window.innerHeight - draggableainameFloatButton.offsetHeight;

          newX = Math.max(0, Math.min(newX, maxX));
          newY = Math.max(0, Math.min(newY, maxY));

          draggableainameFloatButton.style.left = newX + 'px';
          draggableainameFloatButton.style.top = newY + 'px';
        }
      };

      const draggableainameStopDrag = function(){
        document.removeEventListener('mousemove', draggableainameOnMove);
        document.removeEventListener('mouseup', draggableainameStopDrag);
        document.removeEventListener('touchmove', draggableainameOnMove);
        document.removeEventListener('touchend', draggableainameStopDrag);
      };

      draggableainameFloatButton.addEventListener('mousedown', draggableainameStartDrag);
      draggableainameFloatButton.addEventListener('touchstart', draggableainameStartDrag, { passive: false });
    })();
