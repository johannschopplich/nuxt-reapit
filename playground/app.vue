<script setup lang="ts">
const { data } = await useReapit('properties', {
  query: {
    embed: 'images',
    marketingMode: 'selling',
  },
})

const properties = computed(() => data.value?._embedded || [])

if (import.meta.client) {
  watchEffect(() => {
    // eslint-disable-next-line no-console
    console.log(data.value)
  })
}
</script>

<template>
  <Head>
    <Title>nuxt-reapit</Title>
    <Link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/@exampledev/new.css@1.1.2/new.min.css"
    />
  </Head>

  <header>
    <h1>nuxt-reapit</h1>
  </header>

  <h3>Properties Demo Feed</h3>
  <div>
    <div v-for="(item, index) in properties" :key="index">
      <img v-if="item._embedded?.images?.[0]?.url" :src="item._embedded.images[0].url">
      <img v-else src="https://via.placeholder.com/56x56?text=Image+not+supplied+by+agent">
      <div>
        <h5 class="el-card-heading">
          <span v-if="item.address?.buildingName">{{ item.address.buildingName }}</span>
          <span v-if="item.address?.buildingNumber">{{ item.address.buildingNumber }}</span>
          <span v-if="item.address?.line1">{{ item.address.line1 }}</span>
          <span v-if="item.address?.line2">{{ item.address.line2 }}</span>
          <span v-if="item.address?.postcode">{{ item.address.postcode }}</span>
        </h5>
        <h6>£{{ item.selling?.price || 'Price on application' }}</h6>
      </div>
      <p>
        {{ item.strapline || 'No summary available' }}
      </p>
    </div>
  </div>
</template>
