# Telegram Product Matching: n8n Integration

## Overview

The n8n integration provides AI-assisted product matching for medium-confidence matches (70-89%). This document outlines how to set up and configure the n8n workflow for product matching, following the established patterns from the Supabase-to-Glide synchronization system.

## Architecture

![n8n Integration Architecture](./n8n-architecture.svg)

### Components

1. **Supabase PostgreSQL Functions**
   - `send_product_matching_webhook`: Sends medium-confidence matches to n8n
   - `process_ai_matching_result`: Handles responses from n8n

2. **webhook_config Table**
   - Stores endpoint URLs, authentication tokens, and configuration

3. **n8n Workflow**
   - Webhook endpoint for receiving product match data
   - AI integration for enhanced matching decisions
   - Response formatting and callback handling

## Webhook Configuration

The webhook configuration for product matching follows the same pattern as other entity webhooks in the system:

```sql
INSERT INTO webhook_config (
  name, 
  endpoint_url, 
  auth_token, 
  headers, 
  enabled, 
  event_types, 
  description
) VALUES (
  'telegram_product_matching_ai',
  'https://your-n8n-instance.com/webhook/product-matching',
  'your-secure-token-here',
  jsonb_build_object('Content-Type', 'application/json'),
  true,
  ARRAY['product_matching'],
  'Webhook for AI-assisted product matching via n8n'
);
```

## Confidence-Based Routing

The system uses confidence scores to determine the routing path:

1. **High Confidence (90-100%)**: Automatically linked to product
2. **Medium Confidence (70-89%)**: Sent to n8n for AI evaluation
3. **Low Confidence (0-69%)**: Queued for manual review

You can configure these thresholds in the `product_matching_config` table:

```sql
UPDATE product_matching_config 
SET config = jsonb_set(
  config, 
  '{high_confidence_threshold}', 
  '90'
);

UPDATE product_matching_config 
SET config = jsonb_set(
  config, 
  '{medium_confidence_threshold}', 
  '70'
);

UPDATE product_matching_config 
SET config = jsonb_set(
  config, 
  '{use_ai_assistance}', 
  'true'
);
```

## n8n Workflow Setup

### 1. Webhook Node

Create a webhook node in n8n with the following configuration:

- **Authentication**: Basic Auth or Bearer Token for security
- **HTTP Method**: POST
- **Response Mode**: Last Node

### 2. Data Validation

Add a function node to validate the incoming data:

```javascript
// Example validation function
function validateInput(items) {
  const requiredFields = ['message_id', 'confidence_level', 'match_data'];
  const item = items[0].json;
  
  for (const field of requiredFields) {
    if (!item[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  return items;
}
```

### 3. AI Integration

Connect to an AI service (OpenAI, Google Vertex AI, etc.) to analyze the product matches and media. Use a function node to format the prompt:

```javascript
// Example prompt construction
function buildAIPrompt(items) {
  const item = items[0].json;
  const matchData = item.match_data;
  
  const bestMatch = matchData.best_match;
  const caption = matchData.caption_data;
  
  return [
    {
      json: {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a product matching assistant. Your task is to determine if the suggested product match is correct based on the image and product data."
          },
          {
            role: "user",
            content: `Evaluate whether this media message matches the suggested product.
            
            MEDIA URL: ${matchData.message_details?.public_url || 'No URL'}
            MEDIA TYPE: ${matchData.message_details?.mime_type || 'Unknown'}
            CAPTION: ${matchData.message_details?.caption || 'No caption'}
            
            SUGGESTED PRODUCT NAME: ${caption?.product_name || 'Unknown'}
            SUGGESTED VENDOR: ${caption?.vendor_uid || 'Unknown'}
            PURCHASE DATE: ${caption?.purchase_date || 'Unknown'}
            PURCHASE ORDER: ${caption?.purchase_order_uid || 'Unknown'}
            
            BEST MATCH PRODUCT:
            - NAME: ${bestMatch?.vendor_product_name || bestMatch?.new_product_name || bestMatch?.display_name || 'Unknown'}
            - VENDOR PRODUCT NAME: ${bestMatch?.vendor_product_name || 'Unknown'}
            - MATCH SCORE: ${bestMatch?.match_score || 0}%
            - VENDOR MATCHED: ${bestMatch?.match_reasons?.vendor_matched ? 'Yes' : 'No'}
            - DATE MATCH: ${bestMatch?.match_reasons?.purchase_date_match || 'No'}
            - PRODUCT NAME MATCH: ${bestMatch?.match_reasons?.product_name_match || 'No'}
            - PURCHASE ORDER MATCH: ${bestMatch?.match_reasons?.purchase_order_match ? 'Yes' : 'No'}
            
            Based on this information, determine one of the following actions:
            1. auto_match - If you're confident this is the correct product
            2. create_product - If this is clearly a new product that doesn't match
            3. manual_review - If you can't determine confidently either way
            
            Respond with the action and your reasoning.`
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      }
    }
  ];
}
```

### 4. Decision Parsing

Parse the AI response to extract the decision:

```javascript
function parseAIDecision(items) {
  const response = items[0].json.choices[0].message.content;
  
  // Extract decision from AI response
  let action = 'manual_review'; // Default fallback
  let reasoning = response;
  
  if (response.toLowerCase().includes('auto_match')) {
    action = 'auto_match';
  } else if (response.toLowerCase().includes('create_product')) {
    action = 'create_product';
  }
  
  return [
    {
      json: {
        action,
        reasoning,
        original_message_id: items[0].metadata.messageId,
        queue_id: items[0].metadata.queueId,
        original_data: items[0].metadata.originalData
      }
    }
  ];
}
```

### 5. Callback to Supabase

Call the Supabase function to process the AI result:

```javascript
// Example HTTP Request configuration
{
  "url": "https://your-supabase-instance.supabase.co/rest/v1/rpc/process_ai_matching_result",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json",
    "apikey": "{{$env.SUPABASE_API_KEY}}",
    "Authorization": "Bearer {{$env.SUPABASE_API_KEY}}"
  },
  "body": {
    "p_queue_id": "{{$json.queue_id}}",
    "p_action": "{{$json.action}}",
    "p_product_id": "{{$json.best_match_product_id}}",
    "p_confidence_score": "{{$json.confidence_score}}",
    "p_ai_reasoning": "{{$json.reasoning}}"
  }
}
```

## Error Handling

Implement robust error handling in your n8n workflow:

1. **Webhook Log Table**
   - Track all webhook requests and responses
   - Store error messages for debugging
   - Implement retry mechanism for transient failures

2. **Failure Notification**
   - Send alerts for critical failures
   - Log detailed error context
   - Provide manual resolution steps

## Security Considerations

### Authentication

Always use strong authentication between Supabase and n8n:

```sql
-- Generate a secure random token
SELECT encode(gen_random_bytes(32), 'hex');

-- Update the webhook configuration
UPDATE webhook_config
SET auth_token = 'generated-secure-token'
WHERE name = 'telegram_product_matching_ai';
```

In n8n, verify this token in the webhook node or in a function node:

```javascript
function validateAuth(items) {
  const item = items[0];
  const expectedToken = process.env.PRODUCT_MATCHING_SECRET;
  const receivedToken = item.headers.authorization?.replace('Bearer ', '');
  
  if (receivedToken !== expectedToken) {
    throw new Error('Authentication failed');
  }
  
  return items;
}
```

### Data Transmission

1. **Use HTTPS Only**
   - Ensure all communications use TLS/SSL
   - Verify certificate validity

2. **Minimize Data Exposure**
   - Only send necessary fields
   - Mask or exclude sensitive information

## Implementation Checklist

1. Configure the `webhook_config` table with your n8n endpoint
2. Create the n8n workflow with the webhook trigger
3. Set up the AI integration for decision making
4. Implement the callback to Supabase
5. Test with sample product matches
6. Enable AI assistance in the configuration
7. Monitor for performance and accuracy

## Testing

Use the following SQL to test the integration without modifying the production flow:

```sql
-- Test the webhook sending manually
SELECT send_product_matching_webhook(
  'test-message-id',
  jsonb_build_object(
    'best_match', jsonb_build_object(
      'id', 'test-product-id',
      'vendor_product_name', 'Test Product',
      'match_score', 80,
      'match_reasons', jsonb_build_object(
        'vendor_matched', true,
        'purchase_date_match', '0 days difference',
        'product_name_match', 'vendor_product_name'
      )
    ),
    'caption_data', jsonb_build_object(
      'product_name', 'Test Product',
      'vendor_uid', 'Test Vendor',
      'purchase_date', '2025-04-12'
    )
  ),
  'medium'::confidence_level
);
```
