<template>
    <div>
      <h1>D3 Chord Diagram (sans v-for)</h1>
      <svg id="svgChord" width="900" height="900">
        <g id="gChord">
          <g id="gGroups"> </g>
          <g id="gRibbons"></g>
        </g>
      </svg>
    </div>
  </template>
  
  <script>
  
  import * as d3 from 'd3'
  import * as d3c from 'd3-chord'
  
  
  export default {
    data() {
      return {};
    },
    
    mounted() {
  
      console.log("Diagram Chord --------------------------------------------------------------------")
  
      const width = 900;
      const height = width;
      const outerRadius = Math.min(width, height) * 0.5 - 30;
      const innerRadius = outerRadius - 20;
      const matrix = [
      [11975,  5871, 8916, 2868],
      [ 1951, 10048, 2060, 6171],
      [ 8010, 16145, 8090, 8045],
      [ 1013,   990,  940, 6907]];
  
      /*const matrix = [
      [ 12, 36, 35, 48, 14],
      [ 32, 24, 56, 47, 20],
      [ 33, 21, 57, 15, 47],
      [ 11, 10, 33, 27, 18],
      [ 0, 40, 38, 42, 16]];*/
  
      /*const matrix = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
      ]*/
  
      const padAngle = (Math.PI/16)/matrix.length
      //const PiAngle = Math.PI/2
  
      const createChord = d3c.chord(matrix)
        .padAngle(padAngle)
        //.padAngle(PiAngle/8)
        .sortSubgroups(d3.descending)
  
      const createRibbon = d3c.ribbon()
        .radius(innerRadius);
    
  
      // Fonction créations Arcs
  
    function calculateArc(matrix) {
      // Calcule de la somme de toute les valeurs de la matrice
      let sumValue = 0;
      matrix.forEach(rows => {
        rows.forEach((column) => sumValue += column)
      });
      // Calcul des angles avec le padding
      let currentStartAngle = 0;
      let arcValues = [];
      const sizeCircle = (32/31) * sumValue;
      const arcPaddingSize = (Math.PI*(1/16))/matrix.length;
  
      for(let row = 0; row<matrix.length; row++){
        let sumCurrentRow = 0;
        matrix[row].forEach((column) => sumCurrentRow += column);
        let newStartAngle = 0
        if (row == 0) {newStartAngle = currentStartAngle;}
        else {newStartAngle = currentStartAngle + arcPaddingSize;}
        const newEndAngle = newStartAngle + (Math.PI*2)*(sumCurrentRow/sizeCircle);
        currentStartAngle = newEndAngle;
        let newArcValue = [newStartAngle, newEndAngle];
        arcValues.push(newArcValue)
      }
      console.log(arcValues)
      return(arcValues)
    }
    const valAllArc = calculateArc(matrix)
  
   
    // Affichage Diagramme
    const g = d3.select("#gChord")
      .attr("transform", "translate(" + width/2 + "," + height/2 + ")")
    .datum(createChord(matrix))
    console.log(createChord(matrix))
  
  
    // Affichage Arcs
    const arcG = g.select("#gGroups")
      .attr("class", "groups")
    .selectAll("g")
    .data(function(chords) { return chords.groups; })
    .enter()
  
    let ArcArray = [];
    for (let i=0; i<valAllArc.length; i++) {
      ArcArray.push(d3.arc()({
      innerRadius: innerRadius,
      outerRadius: outerRadius,
      startAngle: valAllArc[i][0],
      endAngle: valAllArc[i][1]
      }))
    }
  
    for(let i=0; i<ArcArray.length; i++){
      arcG.append("path")
        .attr("d", ArcArray[i])
    }
  
  
  
    // Affichage Rubans
    const ribbonG = g.select("#gRibbons")
    .selectAll("g")
    .data(function(chords) { return chords; })
    .enter()
  
    ribbonG.append("path")
      .attr("d", createRibbon)
  
    }
  }
    
  </script>
  
  
  <style>
  
  #gRibbons{
  fill-opacity: 0.67;
  }
  
  </style>
  