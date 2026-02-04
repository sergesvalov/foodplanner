# QA Container Instructions

This folder contains a standalone test suite for the FoodPlanner API.

## 1. Deploy
Copy the `qa` folder to your server where the application is running.

## 2. Configure Setup
Check your main application's docker network name:
```bash
docker network ls
```
Likely it is something like `foodplanner_default` or `repo_default`.

Edit `qa/docker-compose.yml` to uncomment the `networks` section and add the correct network name if you want to access the backend by container name (`menu_backend`).

OR, you can simply run the container using `docker run` and attach it to the network manually:

```bash
# Build the image
cd qa
docker build -t foodplanner-qa .

# Run the tests attached to your app's network
docker run --rm --network foodplanner_default -e API_URL=http://menu_backend:8000 foodplanner-qa
```

## 3. View Report
The container will print a Markdown report to the console. 
You can save it to a file:

```bash
docker run --rm --network foodplanner_default -e API_URL=http://menu_backend:8000 foodplanner-qa > report.md
```

Then you can verify the content of `report.md` or copy-paste it to your AI assistant.
