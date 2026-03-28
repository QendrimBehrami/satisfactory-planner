<script lang="ts">
  import { calculate } from "./lib/calculator";

  const result = calculate("Desc_Motor_C", 10);
  console.log(JSON.stringify(result, null, 2));
</script>
