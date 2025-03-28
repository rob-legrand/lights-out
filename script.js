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
                              (
                                 Math.abs(
                                    clickRow - whichRow
                                 ) <= 1.5
                                 && Math.abs(
                                    clickColumn - whichColumn
                                 ) <= 1.5
                              )
                              ? times
                              : 0
                           )
                           : oldBoard.clickNeighborhood === 'hex'
                           ? (
                              (
                                 Math.abs(
                                    clickRow - whichRow
                                 ) <= 1.5
                                 && Math.abs(
                                    clickColumn - whichColumn
                                 ) <= 1.5
                                 && Math.abs(
                                    clickRow - whichRow
                                    + clickColumn - whichColumn
                                 ) <= 1.5
                              )
                              ? times
                              : 0
                           )
                           : oldBoard.clickNeighborhood === 'oblique von Neumann'
                           ? (
                              (
                                 Math.abs(
                                    clickRow - whichRow
                                 ) <= 1.5
                                 && Math.abs(
                                    clickColumn - whichColumn
                                 ) <= 1.5
                                 && (
                                    Math.abs(
                                       clickRow - whichRow
                                       + clickColumn - whichColumn
                                    ) <= 0.5
                                    || Math.abs(
                                       clickRow - whichRow
                                       - (clickColumn - whichColumn)
                                    ) <= 0.5
                                 )
                              )
                              ? times
                              : 0
                           )
                           : (
                              // Assume default click neighborhood: von Neumann.
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
