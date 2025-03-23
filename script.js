/*jslint browser */

// All the code below will be run once the page content finishes loading.
document.addEventListener('DOMContentLoaded', function () {
   'use strict';

   const defaultNumRows = 4;
   const defaultNumColumns = 3;
   const defaultNumLightLevels = 3;
   const validClickNeighborhoods = [
      'Moore',
      'hex',
      'von Neumann',
      'oblique von Neumann'
   ];

   const lightsOut = (function () {

      // An object to hold private functions to operate on lights-out boards.
      const util = Object.freeze({
         createUnfrozenBoard: (oldBoard) => ({
            board: (
               // If the old board looks valid . . .
               (
                  Array.isArray(oldBoard?.board)
                  && oldBoard.board.length > 0
                  && oldBoard.board.every(
                     (oldRow) => (
                        Array.isArray(oldRow) && oldRow.length > 0
                        && oldRow.length === oldBoard.board[0].length
                     )
                  )
               )
               // . . . use it, but correct any invalid lights.
               ? oldBoard.board.map(
                  (oldRow) => oldRow.map(
                     (oldLight) => (
                        (
                           Number.isFinite(oldLight)
                           && oldLight >= 0
                        )
                        ? Math.floor(oldLight)
                        : 0
                     )
                  )
               )
               // Otherwise, create a brand-new board.
               // Use numRows and numColumns if they exist.
               : Array.from(
                  {length: (
                     (
                        Number.isFinite(oldBoard?.numRows)
                        && oldBoard.numRows >= 1
                     )
                     ? Math.floor(oldBoard.numRows)
                     : defaultNumRows
                  )},
                  () => Array.from(
                     {length: (
                        (
                           Number.isFinite(oldBoard?.numColumns)
                           && oldBoard.numColumns >= 1
                        )
                        ? Math.floor(oldBoard.numColumns)
                        : defaultNumColumns
                     )},
                     () => 0
                  )
               )
            ),
            numLightLevels: (
               (
                  Number.isFinite(oldBoard?.numLightLevels)
                  && oldBoard.numLightLevels >= 2
               )
               ? Math.floor(oldBoard.numLightLevels)
               : defaultNumLightLevels
            ),
            clickNeighborhood: (
               validClickNeighborhoods.includes(oldBoard?.clickNeighborhood)
               ? oldBoard.clickNeighborhood
               : validClickNeighborhoods[0]
            )
         }),
         deepCopy: (oldThing, func) => (
            // Create a new object, deeply copied, with func applied at each level.
            typeof func === 'function'
            ? func
            : (x) => x
         )(
            Array.isArray(oldThing)
            // If it's an array, use map directly.
            ? oldThing.map(
               (x) => util.deepCopy(x, func)
            )
            : typeof oldThing === 'object'
            // If it's a non-array object, we must be less direct.
            ? Object.fromEntries(
               Object.entries(oldThing).map(
                  (x) => [x[0], util.deepCopy(x[1], func)]
               )
            )
            // Otherwise, no recursion is required.
            : oldThing
         ),
         randomizeBoardOnce: (oldBoard) => oldBoard.board.reduce(
            (boardSoFar, oldRow, whichRow) => oldRow.reduce(
               (rowSoFar, ignore, whichColumn) => self.click(
                  rowSoFar,
                  whichRow,
                  whichColumn,
                  Math.floor(Math.random() * oldBoard.numLightLevels)
               ),
               boardSoFar
            ),
            oldBoard
         )
      });

      // An object to hold public functions to operate on lights-out boards.
      const self = Object.freeze({
         click: function (oldBoard, clickRow, clickColumn, times) {
            oldBoard = self.createBoard(oldBoard);
            clickRow = (
               (Number.isInteger(clickRow) && clickRow >= 0)
               ? clickRow
               : Number.POSITIVE_INFINITY
            );
            clickColumn = (
               (Number.isInteger(clickColumn) && clickColumn >= 0)
               ? clickColumn
               : Number.POSITIVE_INFINITY
            );
            times = (
               (Number.isInteger(times) && times >= 0)
               ? times
               : 1
            );
            return self.createBoard({
               board: oldBoard.board.map(
                  (oldRow, whichRow) => oldRow.map(
                     (oldLight, whichColumn) => (
                        (
                           (
                              Number.isFinite(oldLight)
                              && oldLight >= 0
                           )
                           ? Math.floor(oldLight)
                           : 0
                        ) + times * oldBoard.numLightLevels - (
                           oldBoard.clickNeighborhood === 'Moore'
                           ? (
                              Math.max(
                                 Math.abs(
                                    clickRow - whichRow
                                 ),
                                 Math.abs(
                                    clickColumn - whichColumn
                                 )
                              ) <= 1.5
                              ? times
                              : 0
                           )
                           : (
                              Math.abs(
                                 clickRow - whichRow
                              ) + Math.abs(
                                 clickColumn - whichColumn
                              ) <= 1.5
                              ? times
                              : 0
                           )
                        )
                     ) % oldBoard.numLightLevels
                  )
               ),
               numLightLevels: oldBoard.numLightLevels,
               clickNeighborhood: oldBoard.clickNeighborhood
            });
         },
         createBoard: (oldBoard) => util.deepCopy(
            util.createUnfrozenBoard(oldBoard),
            Object.freeze
         ),
         isCleared: (board) => board.board.every(
            (row) => row.every(
               (light) => light === 0
            )
         ),
         randomizeBoard: function (oldBoard) {
            const newBoard = util.randomizeBoardOnce(oldBoard);
            return (
               self.isCleared(newBoard)
               ? self.randomizeBoard(newBoard)
               : newBoard
            );
         }
      });

      return self;
   }());

   (function () {
      let lightsOutBoard;

      const localStorageKey = 'lights-out';
      const gameboardElement = document.querySelector('#gameboard');
      const selectNumRowsElement = document.querySelector('#select-num-rows');
      const selectNumColumnsElement = document.querySelector('#select-num-columns');
      const selectNumLightLevelsElement = document.querySelector('#select-num-light-levels');
      const selectClickNeighborhoodElement = document.querySelector('#select-click-neighborhood');

      const updateLightsOut = function () {
         localStorage.setItem(localStorageKey, JSON.stringify(lightsOutBoard));

         document.querySelector('#instructions').textContent = (
            lightsOut.isCleared(lightsOutBoard)
            ? 'A WINNER IS YOU'
            : 'Can you turn all the lights out?'
         );

         gameboardElement.replaceChildren(
            ...lightsOutBoard.board.map(function (row) {
               const newDiv = document.createElement('div');
               newDiv.replaceChildren(
                  ...row.map(function (light) {
                     const newButton = document.createElement('button');
                     newButton.classList.add('light' + light + 'of' + lightsOutBoard.numLightLevels);
                     newButton.type = 'button';
                     return newButton;
                  })
               );
               return newDiv;
            })
         );

         selectNumRowsElement.selectedIndex = [...selectNumRowsElement.options].findIndex(
            (option) => parseInt(option.value, 10) === lightsOutBoard.board.length
         );
         selectNumColumnsElement.selectedIndex = [...selectNumColumnsElement.options].findIndex(
            (option) => parseInt(option.value, 10) === lightsOutBoard.board[0].length
         );
         selectNumLightLevelsElement.selectedIndex = [...selectNumLightLevelsElement.options].findIndex(
            (option) => parseInt(option.value, 10) === lightsOutBoard.numLightLevels
         );
         selectClickNeighborhoodElement.selectedIndex = [...selectClickNeighborhoodElement.options].findIndex(
            (option) => option.value === lightsOutBoard.clickNeighborhood
         );

         [...gameboardElement.childNodes].forEach(function (rowDiv, whichRow) {
            [...rowDiv.childNodes].forEach(function (lightButton, whichColumn) {
               lightButton.addEventListener('click', function () {
                  lightsOutBoard = lightsOut.click(lightsOutBoard, whichRow, whichColumn);
                  updateLightsOut();
               });
            });
         });
      };

      const getUsersSettings = function () {
         lightsOutBoard = lightsOut.randomizeBoard(lightsOut.createBoard({
            numRows: parseInt(selectNumRowsElement.options[
               selectNumRowsElement.selectedIndex
            ].value, 10),
            numColumns: parseInt(selectNumColumnsElement.options[
               selectNumColumnsElement.selectedIndex
            ].value, 10),
            numLightLevels: parseInt(selectNumLightLevelsElement.options[
               selectNumLightLevelsElement.selectedIndex
            ].value, 10),
            clickNeighborhood: selectClickNeighborhoodElement.options[
               selectClickNeighborhoodElement.selectedIndex
            ].value
         }));
         updateLightsOut();
      };

      selectNumRowsElement.addEventListener('change', getUsersSettings);
      selectNumColumnsElement.addEventListener('change', getUsersSettings);
      selectNumLightLevelsElement.addEventListener('change', getUsersSettings);
      selectClickNeighborhoodElement.addEventListener('change', getUsersSettings);
      document.querySelector('#new-game').addEventListener('click', getUsersSettings);

      lightsOutBoard = lightsOut.createBoard(JSON.parse(localStorage.getItem(localStorageKey)));
      updateLightsOut();

   }());
});

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
            lightButtons[row][column].value = ' ';
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

   document.getElementById('new-game').onclick = resizeBoard;

   selectNumRowsElement.onchange = resizeBoard;
   selectNumColumnsElement.onchange = resizeBoard;
   selectNumLightLevelsElement.onchange = resizeBoard;
   selectClickNeighborhoodElement.onchange = resizeBoard;

}());
