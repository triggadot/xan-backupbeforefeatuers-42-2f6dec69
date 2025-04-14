# Telegram Product Matching: n8n Workflow Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing the n8n workflow that handles AI-assisted product matching for medium-confidence matches. The workflow follows the established patterns from the existing Supabase-to-Glide synchronization system.

## Prerequisites

- Running n8n instance (self-hosted or cloud service)
- Access to an AI service (OpenAI, Google AI, etc.)
- Supabase project with the product matching database schema applied
- Webhook configuration in Supabase

## Implementation Steps

### 1. Create the Webhook Trigger Node

1. In n8n, create a new workflow named "Telegram Product Matching"
2. Add a **Webhook** node as the trigger:
   - Authentication: Bearer Token
   - HTTP Method: POST
   - Response Mode: Last Node
   - Path: `/webhook/product-matching`

![Webhook Configuration](./images/webhook-config.png)

### 2. Add Authentication Validation

1. Add a **Function** node after the webhook:
   - Name: "Validate Request"
   - Connect to the Webhook node
   - Code:

```javascript
// Validate incoming webhook request
const item = items[0];
const expectedToken = $env.PRODUCT_MATCHING_SECRET;
const receivedToken = item.headers.authorization?.replace('Bearer ', '');

if (!receivedToken || receivedToken !== expectedToken) {
  throw new Error('Authentication failed');
}

// Store original data in metadata for later use
item.metadata = {
  messageId: item.json.message_id,
  queueId: item.json.queue_id || null,
  confidenceLevel: item.json.confidence_level,
  originalData: item.json
};

return [item];
```

### 3. Extract Media and Match Data

1. Add a **Function** node:
   - Name: "Extract Media Data"
   - Connect to the Validation node
   - Code:

```javascript
// Extract relevant data for AI processing
const item = items[0];
const matchData = item.json.match_data;
const messageDetails = matchData.message_details || {};

// Prepare data for AI analysis
return [{
  json: {
    mediaUrl: messageDetails.public_url || null,
    mimeType: messageDetails.mime_type || 'unknown',
    caption: messageDetails.caption || '',
    suggestedProductName: matchData.caption_data?.product_name || '',
    suggestedVendor: matchData.caption_data?.vendor_uid || '',
    purchaseDate: matchData.caption_data?.purchase_date || '',
    purchaseOrder: matchData.caption_data?.purchase_order_uid || '',
    bestMatch: matchData.best_match || null,
    allMatches: matchData.all_matches || [],
    confidenceLevel: item.json.confidence_level,
    messageId: item.json.message_id,
    queueId: item.json.queue_id || null
  },
  metadata: item.metadata
}];
```

### 4. Implement AI Analysis

#### 4.1 Image Analysis (Optional)

If the media is an image, you may want to analyze it with AI vision capabilities:

1. Add an **HTTP Request** node:
   - Name: "Analyze Image (Optional)"
   - Method: POST
   - URL: AI vision service endpoint
   - Authentication: API Key
   - JSON Body: Configure according to your AI provider's API
   - Skip if no mediaUrl: Add an IF node to check for image media

#### 4.2 Product Match Analysis

1. Add an **OpenAI** node (or equivalent for your AI provider):
   - Name: "Analyze Product Match"
   - Model: GPT-4 or other model with strong reasoning
   - System prompt:

```
You are a product matching assistant for an inventory system. 
You analyze Telegram media messages and determine if they match with existing products.
Your task is to decide between three actions:
1. auto_match - The media clearly matches the suggested product
2. create_product - The media is a new product that doesn't match existing ones
3. manual_review - There's ambiguity and human review is needed

Provide your reasoning and be specific about why you chose a particular action.
```

   - User prompt (configured via Expression):

```
Analyze whether this Telegram media matches the suggested product:

MEDIA URL: {{$json.mediaUrl}}
MEDIA TYPE: {{$json.mimeType}}
CAPTION: {{$json.caption}}

SUGGESTED PRODUCT:
NAME: {{$json.suggestedProductName}}
VENDOR: {{$json.suggestedVendor}}
PURCHASE DATE: {{$json.purchaseDate}}
PURCHASE ORDER: {{$json.purchaseOrder}}

BEST MATCH FROM DATABASE:
NAME: {{$json.bestMatch ? ($json.bestMatch.vendor_product_name || $json.bestMatch.new_product_name || $json.bestMatch.display_name || 'Unknown') : 'No match found'}}
VENDOR PRODUCT NAME: {{$json.bestMatch ? $json.bestMatch.vendor_product_name : 'N/A'}}
MATCH SCORE: {{$json.bestMatch ? $json.bestMatch.match_score : 0}}%
MATCH REASONS: {{$json.bestMatch ? JSON.stringify($json.bestMatch.match_reasons) : 'N/A'}}

Based on this information, determine ONE of these actions:
- auto_match: If the media clearly matches the suggested product
- create_product: If this is clearly a new product that doesn't match
- manual_review: If there's ambiguity and you can't confidently determine

Respond with your chosen action and detailed reasoning.
```

### 5. Parse AI Decision

1. Add a **Function** node:
   - Name: "Parse AI Decision"
   - Connect to the AI node
   - Code:

```javascript
// Extract decision from AI response
const item = items[0];
const aiResponse = item.json.choices[0].message.content;
const metadata = item.metadata;

// Parse action from response
let action = 'manual_review'; // Default fallback
let reasoning = aiResponse;

if (/auto[_\s-]?match/i.test(aiResponse)) {
  action = 'auto_match';
} else if (/create[_\s-]?product/i.test(aiResponse)) {
  action = 'create_product';
}

// Get the product ID from best match if available and auto-matching
let productId = null;
if (action === 'auto_match' && metadata.originalData?.match_data?.best_match?.glide_row_id) {
  productId = metadata.originalData.match_data.best_match.glide_row_id;
}

// Parse confidence score if available
let confidenceScore = null;
if (metadata.originalData?.match_data?.best_match?.match_score) {
  confidenceScore = metadata.originalData.match_data.best_match.match_score;
}

return [{
  json: {
    action,
    reasoning,
    queue_id: metadata.queueId,
    product_id: productId,
    confidence_score: confidenceScore
  }
}];
```

### 6. Callback to Supabase

1. Add an **HTTP Request** node:
   - Name: "Process AI Result"
   - Method: POST
   - URL: `{{$env.SUPABASE_URL}}/rest/v1/rpc/process_ai_matching_result`
   - Authentication: API Key (Header)
   - Headers:
     - Content-Type: application/json
     - apikey: `{{$env.SUPABASE_API_KEY}}`
     - Authorization: Bearer `{{$env.SUPABASE_API_KEY}}`
   - JSON Body:

```json
{
  "p_queue_id": "{{$json.queue_id}}",
  "p_action": "{{$json.action}}",
  "p_product_id": "{{$json.product_id}}",
  "p_confidence_score": "{{$json.confidence_score}}",
  "p_ai_reasoning": "{{$json.reasoning}}"
}
```

### 7. Handle Response

1. Add a **Function** node for the final response:
   - Name: "Format Response"
   - Connect to the HTTP Request node
   - Code:

```javascript
// Format final response
const item = items[0];
let success = false;
let message = 'Unknown error';

try {
  // Parse Supabase response
  const response = item.json;
  success = response.success === true;
  message = response.message || (success ? 'Operation successful' : 'Operation failed');
} catch (error) {
  message = `Error processing response: ${error.message}`;
}

return [{
  json: {
    success,
    message,
    timestamp: new Date().toISOString(),
    action: items[0].json.action
  }
}];
```

### 8. Error Handling

1. Add **Error Trigger** nodes connected to each main node
2. Create a unified error handler that logs errors and returns a standardized error response

## Environment Variables

Set up the following environment variables in n8n:

1. `PRODUCT_MATCHING_SECRET` - The authentication token matching your webhook_config
2. `SUPABASE_URL` - Your Supabase project URL
3. `SUPABASE_API_KEY` - Service role key for Supabase
4. `OPENAI_API_KEY` - If using OpenAI for AI analysis

## Testing the Workflow

### Test with Sample Data

Create a test workflow with an **Execute Workflow** trigger that sends sample data:

```json
{
  "message_id": "00000000-0000-0000-0000-000000000000",
  "queue_id": "00000000-0000-0000-0000-000000000001",
  "confidence_level": "medium",
  "match_data": {
    "best_match": {
      "id": "sample-product-id",
      "glide_row_id": "sample-glide-row-id",
      "vendor_product_name": "Sample Product",
      "match_score": 75,
      "match_reasons": {
        "vendor_matched": true,
        "purchase_date_match": "1 days difference",
        "product_name_match": null,
        "purchase_order_match": false
      }
    },
    "caption_data": {
      "product_name": "Sample Product",
      "vendor_uid": "Sample Vendor",
      "purchase_date": "2025-04-12"
    },
    "message_details": {
      "public_url": "https://example.com/sample-image.jpg",
      "mime_type": "image/jpeg",
      "caption": "Sample product caption"
    }
  }
}
```

### Webhook Integration Testing

Test the complete integration between Supabase and n8n by triggering the webhook from Supabase:

```sql
SELECT * FROM send_product_matching_webhook(
  '00000000-0000-0000-0000-000000000000',
  jsonb_build_object(
    'best_match', jsonb_build_object(
      'id', 'test-product-id',
      'glide_row_id', 'test-glide-row-id',
      'vendor_product_name', 'Test Product',
      'match_score', 75,
      'match_reasons', jsonb_build_object(
        'vendor_matched', true,
        'purchase_date_match', '1 days difference',
        'product_name_match', null,
        'purchase_order_match', false
      )
    ),
    'caption_data', jsonb_build_object(
      'product_name', 'Test Product',
      'vendor_uid', 'Test Vendor',
      'purchase_date', '2025-04-12'
    ),
    'message_details', jsonb_build_object(
      'public_url', 'https://example.com/sample-image.jpg',
      'mime_type', 'image/jpeg',
      'caption', 'Sample product caption'
    )
  ),
  'medium'::confidence_level
);
```

## Extending the Workflow

### Image Analysis Enhancement

Add image analysis to improve matching accuracy:

1. Extract product features from images (color, shape, logos)
2. OCR text from product images
3. Compare image similarity with existing product images

### Additional AI Capabilities

Enhance the AI decision-making with:

1. Product categorization based on image/text
2. Automatic price estimation
3. Competitive product identification

## Maintenance and Monitoring

### Logging

Implement comprehensive logging:

1. Add an **HTTP Request** node to log all workflow executions to a monitoring service
2. Store execution details in a dedicated logging table

### Performance Tracking

Track key metrics:

1. AI decision accuracy (using admin feedback)
2. Processing time per message
3. Error rates and common failure patterns

### Regular Model Tuning

Update your AI prompts based on feedback:

1. Review cases where AI made incorrect decisions
2. Adjust prompt wording to address common errors
3. Consider fine-tuning models on your specific product data

## Integration with Wider Workflow

This Telegram product matching workflow fits into your overall Supabase-to-Glide synchronization system as described in your implementation plan. Following the same architectural patterns ensures consistency and maintainability across all integrations.
