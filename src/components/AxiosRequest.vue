<script>
//<script setup>
import axios from 'axios';
//import { ref } from 'vue'


/*axios({
  method: 'get',
  url: '/lines',
  baseURL: 'https://opendata.koumoul.com/data-fair/api/v1/datasets/vitesses-pratiquees-issues-des-voitures-radars-a-conduite-externalisee',
  params: {
    sort: 'mesure'
  },
})
  .then(function (response) {
    console.log(response.data.results[0].limite);
  })
  .catch(function (error) {
    console.log(error);
  })
  .finally(function () {
    // always executed
  });*/


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
  //console.log(newMatrix)
  return newMatrix
}

function listeRegion(dataValues) {
  const regionsList = []
  for (let i=0; i<dataValues.total_values; i++) {
    regionsList.push(dataValues.aggs[i].value)
  }
  return regionsList
}



  //const tableDonneesA = ref(null)
  const url = 'https://koumoul.com/data-fair/api/v1/datasets/fichier-personnes-decedees/values_agg?field=nom_actuel_region_naissance;nom_actuel_region_deces'

  let data
  let globalData
  const axiosData = async () => {
    //let data
    try {
      data = await axios.get(url);
    }
    catch(error) {
      console.log(error)
    }
    return data.data
  }

  globalData = await axiosData()

  //const dataMatrix = createMatrix(globalData)
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


  //console.log("Axios:")

  //console.log("1:")

  /*const axiosData = axios.get('https://koumoul.com/data-fair/api/v1/datasets/fichier-personnes-decedees/values_agg?field=nom_actuel_region_naissance;nom_actuel_region_deces', {})
  .then(function (response) {
    //console.log(response)
    tableDonneesA.value = response.data.aggs[0]
    console.log("2:")
    console.log(tableDonneesA)
    return tableDonneesA.value
  })
  .catch(function (error) {
    console.log(error);
  })
  .finally(function () {
    const test = createMatrix(tableDonneesA.value)
    console.log(test)
    // always executed
  });
  
  //console.log(axiosData.then())
  /*console.log("3:")
  console.log(tableDonneesA)*/



//---------------------------------------------------------


</script>


<template>
  <div>
    <h1>Test requêtes Axios:</h1>
    <!--pre>{{globalData}}</pre-->
  </div>
</template>


<style scoped>
</style>