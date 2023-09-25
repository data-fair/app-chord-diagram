<script>
import axios from 'axios';

//---------------------------------------------------------

function createMatrix(dataValues) {
  const regionsList = []
  const numMaxRegion = dataValues.total_values

  for (let r=0; r<numMaxRegion; r++) {
    regionsList.push(dataValues.aggs[r].value)
  }

  const newMatrix = []
  for (let i=0; i<numMaxRegion; i++) {
    const numRegion = dataValues.aggs[i].total_values
    const newRow = []
    const rowRegion = []
    for (let j=0; j<numRegion; j++) {
        rowRegion.push(dataValues.aggs[i].aggs[j].value)
    }
    regionsList.forEach(region => {
      if (!(rowRegion.includes(region))) {newRow.push(0)}
      for (let j=0; j<numRegion; j++) {
        if (region == dataValues.aggs[i].aggs[j].value) {
          newRow.push(dataValues.aggs[i].aggs[j].total)
        }
      }
    })
    newMatrix.push(newRow)
  }
  return newMatrix
}

function listeRegion(dataValues) {
  const regionsList = []
  for (let i=0; i<dataValues.total_values; i++) {
    regionsList.push(dataValues.aggs[i].value)
  }
  return regionsList
}


  const url = 'https://koumoul.com/data-fair/api/v1/datasets/fichier-personnes-decedees/values_agg?field=nom_actuel_region_naissance;nom_actuel_region_deces'

  let data
  let globalData
  const axiosData = async () => {
    try {
      data = await axios.get(url);
    }
    catch(error) {
      console.log(error)
    }
    return data.data
  }

  globalData = await axiosData()

  const datasTest = createMatrix(globalData)
  const dataRegion = listeRegion(globalData)
  
  const dataMatrix = [datasTest, dataRegion]

  export {dataMatrix}

  export default {
    data () {
      return {
        dataMatrix
      }
    }
  }

//---------------------------------------------------------


</script>


<template>
  <div>
    <h1>Test requêtes Axios:</h1>
  </div>
</template>


<style scoped>
</style>