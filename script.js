/*jslint browser: true, vars: true, indent: 3 */

(function () {
   'use strict';

   var maxNumRows = 6;
   var maxNumColumns = 5;
   var selectNumRowsElement = document.getElementById('select-num-rows');
   var numRows = parseInt(selectNumRowsElement.options[selectNumRowsElement.selectedIndex].value, 10);
   var selectNumColumnsElement = document.getElementById('select-num-columns');
   var numColumns = parseInt(selectNumColumnsElement.options[selectNumColumnsElement.selectedIndex].value, 10);
   var selectNumLightLevelsElement = document.getElementById('select-num-light-levels');
   var numLightLevels = parseInt(selectNumLightLevelsElement.options[selectNumLightLevelsElement.selectedIndex].value, 10);
   var selectClickNeighborhoodElement = document.getElementById('select-click-neighborhood');
   var clickNeighborhood = selectClickNeighborhoodElement.options[selectClickNeighborhoodElement.selectedIndex].value;
   var lightButtons = [[document.getElementById('r1c1'), document.getElementById('r1c2'), document.getElementById('r1c3'), document.getElementById('r1c4'), document.getElementById('r1c5')],
                       [document.getElementById('r2c1'), document.getElementById('r2c2'), document.getElementById('r2c3'), document.getElementById('r2c4'), document.getElementById('r2c5')],
                       [document.getElementById('r3c1'), document.getElementById('r3c2'), document.getElementById('r3c3'), document.getElementById('r3c4'), document.getElementById('r3c5')],
                       [document.getElementById('r4c1'), document.getElementById('r4c2'), document.getElementById('r4c3'), document.getElementById('r4c4'), document.getElementById('r4c5')],
                       [document.getElementById('r5c1'), document.getElementById('r5c2'), document.getElementById('r5c3'), document.getElementById('r5c4'), document.getElementById('r5c5')],
                       [document.getElementById('r6c1'), document.getElementById('r6c2'), document.getElementById('r6c3'), document.getElementById('r6c4'), document.getElementById('r6c5')]];
   var colors = ['#aaaaaa', '#00ff55'];
   var row, column;

   var lights = [];
   for (row = 0; row < maxNumRows; row += 1) {
      lights[row] = [];
      for (column = 0; column < maxNumColumns; column += 1) {
         lights[row][column] = 0;
      }
   }

   for (row = 0; row < maxNumRows; row += 1) {
      for (column = 0; column < maxNumColumns; column += 1) {
         lightButtons[row][column].style.display = row < numRows && column < numColumns ? '' : 'none';
      }
   }

   var clearBoard = function () {
      var row, column;
      for (row = 0; row < numRows; row += 1) {
         for (column = 0; column < numColumns; column += 1) {
            lights[row][column] = 0;
         }
      }
   };

   var isBoardCleared = function () {
      var row, column;
      for (row = 0; row < numRows; row += 1) {
         for (column = 0; column < numColumns; column += 1) {
            if (lights[row][column] > 0) {
               return false;
            }
         }
      }
      return true;
   };

   var updateBoard = function () {
      var row, column;
      for (row = 0; row < numRows; row += 1) {
         for (column = 0; column < numColumns; column += 1) {
            lightButtons[row][column].style.backgroundColor = colors[lights[row][column]];
         }
      }
      document.getElementById('instructions').innerHTML = isBoardCleared() ? 'A WINNER IS YOU' : 'Can you turn all the lights out?';
   };

   var flipLight = function (row, column) {
      if (row >= 0 && row < numRows && column >= 0 && column < numColumns) {
         lights[row][column] = (lights[row][column] + numLightLevels - 1) % numLightLevels;
      }
   };

   var clickLight = function (row, column, times) {
      var whichClick;
      if (typeof times !== 'number') {
         times = 1;
      }
      for (whichClick = 0; whichClick < times; whichClick += 1) {
         flipLight(row, column);
         if (clickNeighborhood === 'Moore' || clickNeighborhood === 'oblique von Neumann') {
            flipLight(row - 1, column - 1);
            flipLight(row + 1, column + 1);
         }
         if (clickNeighborhood === 'Moore' || clickNeighborhood === 'hex' || clickNeighborhood === 'oblique von Neumann') {
            flipLight(row - 1, column + 1);
            flipLight(row + 1, column - 1);
         }
         if (clickNeighborhood === 'Moore' || clickNeighborhood === 'hex' || clickNeighborhood === 'von Neumann') {
            flipLight(row - 1, column);
            flipLight(row, column - 1);
            flipLight(row, column + 1);
            flipLight(row + 1, column);
         }
      }
   };

   var randomizeBoard = function () {
      var row, column;
      clearBoard();
      do {
         for (row = 0; row < numRows; row += 1) {
            for (column = 0; column < numColumns; column += 1) {
               clickLight(row, column, Math.floor(numLightLevels * Math.random()));
            }
         }
      } while (isBoardCleared());
   };

   var clickFunc = function (row, column) {
      return function () {
         clickLight(row, column);
         updateBoard();
      };
   };
   for (row = 0; row < maxNumRows; row += 1) {
      for (column = 0; column < maxNumColumns; column += 1) {
         lightButtons[row][column].onclick = clickFunc(row, column);
      }
   }

   var newGame = function () {
      randomizeBoard();
      updateBoard();
   };

   var resizeBoard = function () {
      var column, row;
      numRows = parseInt(selectNumRowsElement.options[selectNumRowsElement.selectedIndex].value, 10);
      numColumns = parseInt(selectNumColumnsElement.options[selectNumColumnsElement.selectedIndex].value, 10);
      numLightLevels = parseInt(selectNumLightLevelsElement.options[selectNumLightLevelsElement.selectedIndex].value, 10);
      clickNeighborhood = selectClickNeighborhoodElement.options[selectClickNeighborhoodElement.selectedIndex].value;
      if (numLightLevels === 2) {
         colors = ['#aaaaaa', '#00ff55'];
      } else if (numLightLevels === 3) {
         colors = ['#aaaaaa', '#6688cc', '#0055ff'];
      } else {
         colors = ['#aaaaaa', '#0088cc', '#77dd00', '#ff0055'];
      }
      for (row = 0; row < maxNumRows; row += 1) {
         for (column = 0; column < maxNumColumns; column += 1) {
            lightButtons[row][column].style.display = row < numRows && column < numColumns ? '' : 'none';
         }
      }
      newGame();
   };
   resizeBoard();

   document.getElementById('new-game').onclick = newGame;

   selectNumRowsElement.onchange = resizeBoard;
   selectNumColumnsElement.onchange = resizeBoard;
   selectNumLightLevelsElement.onchange = resizeBoard;
   selectClickNeighborhoodElement.onchange = resizeBoard;
}());
