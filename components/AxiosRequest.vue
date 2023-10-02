<script>
import axios from 'axios'

// ---------------------------------------------------------

function createMatrix (dataValues) {
  const regionsList = []
  const numMaxRegion = dataValues.total_values

  for (let r = 0; r < numMaxRegion; r++) {
    regionsList.push(dataValues.aggs[r].value)
  }

  const newMatrix = []
  for (let i = 0; i < numMaxRegion; i++) {
    const numRegion = dataValues.aggs[i].total_values
    const newRow = []
    const rowRegion = []
    for (let j = 0; j < numRegion; j++) {
      rowRegion.push(dataValues.aggs[i].aggs[j].value)
    }
    regionsList.forEach((region) => {
      if (!(rowRegion.includes(region))) { newRow.push(0) }
      for (let j = 0; j < numRegion; j++) {
        if (region === dataValues.aggs[i].aggs[j].value) {
          newRow.push(dataValues.aggs[i].aggs[j].total)
        }
      }
    })
    newMatrix.push(newRow)
  }
  return newMatrix
}

function listeRegion (dataValues) {
  const regionsList = []
  for (let i = 0; i < dataValues.total_values; i++) {
    regionsList.push(dataValues.aggs[i].value)
  }
  return regionsList
}

const application = window.APPLICATION
console.log(application)
const config = application.configuration

const url = `${config.datasets[0].href}/values_agg?field=${config.sourceField.key};${config.targetField.key}`

// const field = 'values_agg?field=' + config.sourceField.key + ';' + config.targetField.key
// const href = {datasets.0.href}
// const url2 = href + field
// https://koumoul.com/data-fair/api/v1/datasets/(JDD à récup)/values_agg?field=(source);(target)

let data
const axiosData = async () => {
  try {
    data = await axios.get(url)
  } catch (error) {
    console.log(error)
  }
  return data.data
}

const globalData = await axiosData()

const datasTest = createMatrix(globalData)
const dataRegion = listeRegion(globalData)

const dataMatrix = [datasTest, dataRegion]

export { dataMatrix }

export default {
  data () {
    return {
      dataMatrix
    }
  }
}

// ---------------------------------------------------------

</script>

<template>
  <div>
    <h1>Test requêtes Axios:</h1>
  </div>
</template>

<style scoped>
</style>
