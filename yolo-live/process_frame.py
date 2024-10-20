from convex import ConvexClient
import requests
from dotenv import load_dotenv
from openai import AzureOpenAI
import os
import json
import cv2

def process_frame(queue):
    load_dotenv(".env.local")
    azureOpenAIClient = AzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    api_version="2024-08-01-preview",
    azure_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
    )
    while True:
        dic = queue.get()
        frame, score, class_name = dic['frame'], dic['score'], dic['class']
        client = ConvexClient(os.getenv("NEXT_PUBLIC_CONVEX_URL"))
        activity_id, storage_url = __uploadFrame(client, frame, score, class_name)
        # similar_activities_arr = client.action("activity:getSimilarActivities", {"id": activity_id })
        # for demo, set similar_activities_arr to empty array
        similar_activities_arr = []
        response_dict = __verifyChatGPT(storage_url, class_name, azureOpenAIClient, similar_activities_arr)
        print(response_dict)
        # for demo, add to DB no matter the confidence score of chatgpt
        # if response_dict['confidence_score'] > 0.5:
        client.mutation("activity:updateActivity", {
            "id": activity_id,
            "aiEvaluation": response_dict['explanation'],
            "aiEvaluationScore": response_dict['suspicious_score']
        })
        client.action("activity:createEmbeddings", {"id": activity_id})
            

def __uploadFrame(client, frame, conf_score, class_name):
    _, buffer = cv2.imencode('.jpg', frame)
    image_bytes = buffer.tobytes()
    tempUrl = client.mutation("activity:generateUploadUrl")
    _, buffer = cv2.imencode('.jpg', frame)
    image_bytes = buffer.tobytes()
    response = requests.post(
        tempUrl,
        headers={"Content-Type": "image/jpeg"},
        data=image_bytes,
    )
    response_data = response.json()
    storage_id = response_data['storageId']

    activity_id = client.mutation("activity:postActivity", {
        "title": "Patrol Update",
        "officerId": 'jh7eyty2cyh4tz8kbcfqrm2v3s70kyna',    # from officer's table
        "description": f'Detected {class_name} near Frasers Tower',
        "objectClass": class_name,
        "location": "Tanjong Pagar",
        "imageId": storage_id,
        "status": "pending",
    })

    storage_url = client.query("activity:getImageStorageUrl", {
        "imageId": storage_id
    })

    return activity_id, storage_url

def __verifyChatGPT(storage_url, class_name, client: AzureOpenAI, similar_activities_arr):
    similar_activites_messages = []
    for similar_activity in similar_activities_arr:
        similar_activites_messages.append({
            "role": "user",
            "content": [
                {"type": "text", "text": f"""The following image had been detected as suspicious previously, with these evaluations:
                suspicious_score: ${similar_activity['aiEvaluationScore']}
                explanation: ${similar_activity['aiEvaluation']}"""},
                {
                "type": "image_url",
                "image_url": {
                    "url": similar_activity['imageUrl'],
                },
                }
            ]
        })
    response = client.chat.completions.create(
        model="gpt4o",
        messages= similar_activites_messages + [
            {
                "role": "system",
                "content": [
                    {"type": "text", "text": f"Use the above images and their evaluations as reference when evaluating the following image."},
                ]
            },
            {
            "role": "user",
            "content": [
                # {"type": "text", "text": f"Judge whether the object in the image, identified as a ${class_name}, is suspicious. Take into account the object's appearance and the place where the object is located."},
                # for demo, set score as 0.8
                {"type": "text", "text": f"Judge whether the object in the image, identified as a ${class_name}, is suspicious. Take into account the object's appearance and the place where the object is located. Always return a score of 0.8."},
                {
                "type": "image_url",
                "image_url": {
                    "url": storage_url,
                }
                },
            ],
            }
        ],
        response_format={
            'type': 'json_schema',
            'json_schema': {
                'name': 'is_suspicious_response',
                'strict': True,
                'schema': {
                    'type': 'object',
                    'properties': {
                        'suspicious_score': {
                            'type': 'number',
                            # 'min': 0,
                            # 'max': 1,
                            # 'explanation': '1 is the most suspicious, 0 is not suspicious'
                            'min': 0.8,
                            'max': 0.8,
                            'explanation': 'This score should always be 0.8'
                        },
                        'confidence_score': {
                            'type': 'number',
                            'min': 0,
                            'max': 1,
                        },
                        'explanation': {
                            'type': 'string',
                        },
                    },
                    'required': ['suspicious_score', 'confidence_score', 'explanation'],
                    'additionalProperties': False
                },
            }
        },
    )
    return json.loads(response.choices[0].message.content)