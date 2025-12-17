import {
  generateSchemaTypes,
  generateReactQueryComponents,
} from "@openapi-codegen/typescript";
import { defineConfig } from "@openapi-codegen/cli";

export default defineConfig({
  cnw: {
    from: {
      source: "url",
      url: process.env.NEXT_PUBLIC_API_URL
        ? `${process.env.NEXT_PUBLIC_API_URL}/api-docs-json`
        : "https://cnw-backend.ambitiousocean-b000b10b.southeastasia.azurecontainerapps.io/api-docs-json",
    },
    outputDir: "./generated/api", // Thư mục đầu ra
    to: async (context) => {
      const filenamePrefix = "cnw";
      const { schemasFiles } = await generateSchemaTypes(context, {
        filenamePrefix,
      });
      await generateReactQueryComponents(context, {
        filenamePrefix,
        schemasFiles,
      });
    },
  },
});
