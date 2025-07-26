<script setup>
const { data: api } = await useFetch('/api')
const { data: json } = await useFetch('/api/wait-ms?ms=1000')
const { data: anotherEndpoint } = await useFetch('/api/another-endpoint')
const { data: eventFetch } = await useFetch('/api/event-fetch')
const { data: eventObject } = await useFetch('/api/event-object')
const { data: dynamicTest } = await useFetch('/api/dynamic/test')
</script>

<template>
  <div>
    <h1>Nuxt OpenTelemetry Playground</h1>
    <h2>API Data</h2>
    <pre>{{ api }}</pre>

    <h2>JSON Data</h2>
    <pre>{{ json }}</pre>

    <h2>Another Endpoint</h2>
    <pre>{{ anotherEndpoint }}</pre>

    <h2>Event Fetch</h2>
    <pre>{{ eventFetch }}</pre>

    <h2>Event Object</h2>
    <pre>{{ eventObject }}</pre>

    <h2>Dynamic Test</h2>
    <pre>{{ dynamicTest }}</pre>
  </div>
</template>
