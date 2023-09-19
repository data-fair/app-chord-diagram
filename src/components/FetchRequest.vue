<script setup>

import { ref } from 'vue'

const url = `https://koumoul.com/data-fair/api/v1/datasets/fichier-personnes-decedees/values_agg?field=nom_actuel_region_naissance;nom_actuel_region_deces`

const tableDonneesF = ref(null)




/*function currentloginid() {
  return fetch(url, {
      method: 'GET',
    })
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      var userid = JSON.parse(data);
      console.log(userid);
      return userid;
    })
}

console.log(await currentloginid());*/










const fetchData = 
tableDonneesF.value = null
const res = await fetch(url)
tableDonneesF.value = await res.json()


//const testF = fetchData

console.log(tableDonneesF.value)
//var test = 0
//console.log(testF)

/*async function fetchData() {
  fetch(
    `https://koumoul.com/data-fair/api/v1/datasets/fichier-personnes-decedees/values_agg?field=nom_actuel_region_naissance;nom_actuel_region_deces`
    )
  .then(response => {
    //console.log(response)
    return response.json()
    })
  .then((regions) => {
    console.log(regions);
    //test = await regions
    for (const region of regions.aggs) {
      //
    }
    })
}*/

//console.log(test)

</script>

<template>
  <h1>Test requêtes Fetch:</h1>
  <p></p>
  <p v-if="!tableDonneesF">Loading...</p>
  <pre v-else>{{ tableDonneesF }}</pre>
</template>
