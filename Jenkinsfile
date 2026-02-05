pipeline {
    agent any

    parameters {
        booleanParam(name: 'RUN_TESTS', defaultValue: false, description: 'Run automated tests after deployment?')
    }

    environment {
        // === 1. НАСТРОЙКИ СЕРВЕРА И РЕЕСТРА ===
        REGISTRY_IP   = "192.168.10.222"
        REGISTRY_PORT = "5050"
        DEPLOY_SERVER = "192.168.10.223"
        SERVER_USER   = "serge"
        
        // === 2. НАСТРОЙКИ ПРОЕКТА ===
        IMG_BACKEND   = "${REGISTRY_IP}:${REGISTRY_PORT}/foodplanner-backend"
        IMG_FRONTEND  = "${REGISTRY_IP}:${REGISTRY_PORT}/foodplanner-frontend"
        IMG_QA        = "${REGISTRY_IP}:${REGISTRY_PORT}/foodplanner-qa"
        IMG_QA_FRONTEND = "${REGISTRY_IP}:${REGISTRY_PORT}/foodplanner-qa-frontend"
        
        PROJECT_NAME  = "foodplanner"
        APP_PORT      = "8010"
        
        // Путь на физическом сервере Ubuntu
        DB_PATH       = "/opt/foodplanner"
        
        GIT_CREDS     = "github-ssh-key"
        SSH_CREDS     = "serge"
        REPO_URL      = "git@github.com:sergesvalov/foodplanner.git"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout([$class: 'GitSCM', 
                    branches: [[name: "*/main"]], 
                    userRemoteConfigs: [[url: env.REPO_URL, credentialsId: env.GIT_CREDS]]
                ])
            }
        }

        stage('Build & Push') {
            steps {
                script {
                    echo "🔨 Building Backend..."
                    sh "docker build -t ${IMG_BACKEND}:${BUILD_NUMBER} -t ${IMG_BACKEND}:latest ./backend"
                    
                    echo "🔨 Building Frontend..."
                    sh "docker build -t ${IMG_FRONTEND}:${BUILD_NUMBER} -t ${IMG_FRONTEND}:latest ./frontend"

                    echo "🚀 Pushing App images..."
                    sh "docker push ${IMG_BACKEND}:${BUILD_NUMBER}"
                    sh "docker push ${IMG_BACKEND}:latest"
                    sh "docker push ${IMG_FRONTEND}:${BUILD_NUMBER}"
                    sh "docker push ${IMG_FRONTEND}:latest"

                    if (params.RUN_TESTS) {
                        echo "🧪 Building QA (Backend)..."
                        sh "docker build -t ${IMG_QA}:${BUILD_NUMBER} ./qa"
                        sh "docker push ${IMG_QA}:${BUILD_NUMBER}"

                        echo "🧪 Building QA (Frontend)..."
                        sh "docker build -t ${IMG_QA_FRONTEND}:${BUILD_NUMBER} ./qa/frontend"
                        sh "docker push ${IMG_QA_FRONTEND}:${BUILD_NUMBER}"
                    }
                }
            }
        }

        stage('Deploy to Server') {
            steps {
                sshagent(credentials: [SSH_CREDS]) {
                    script {
                        sh """
                            ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${DEPLOY_SERVER} '
                                set -e
                                
                                mkdir -p ~/${PROJECT_NAME}
                                cd ~/${PROJECT_NAME}

                                echo "📄 Generating docker-compose.yml..."
                                cat <<EOF > docker-compose.yml
version: "3.8"
services:
  backend:
    image: ${IMG_BACKEND}:${BUILD_NUMBER}
    container_name: ${PROJECT_NAME}-backend
    restart: unless-stopped
    volumes:
       - ${DB_PATH}:/app/data
    expose:
       - "8000"

  frontend:
    image: ${IMG_FRONTEND}:${BUILD_NUMBER}
    container_name: ${PROJECT_NAME}-frontend
    restart: unless-stopped
    ports:
      - "${APP_PORT}:80"
    depends_on:
      - backend
EOF

                                echo "⬇️ Pulling images..."
                                docker compose pull

                                echo "🔄 Restarting services..."
                                docker compose up -d --remove-orphans
                                
                                echo "📊 Status:"
                                docker compose ps
                            '
                        """
                    }
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                script {
                    echo "🔍 Checking availability..."
                    sleep 15
                    sh "curl -f -I http://${DEPLOY_SERVER}:${APP_PORT}/"
                }
            }
        }

        stage('Run Remote Tests') {
            when { expression { return params.RUN_TESTS } }
            steps {
                sshagent(credentials: [SSH_CREDS]) {
                    script {
                        echo "🧪 Running Tests on Remote Server..."
                        sh """
                            ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${DEPLOY_SERVER} '
                                echo "⬇️ Pulling QA images..."
                                docker pull ${IMG_QA}:${BUILD_NUMBER}
                                docker pull ${IMG_QA_FRONTEND}:${BUILD_NUMBER}

                                echo "🚀 Running Backend Tests..."
                                docker run --rm \\
                                    --network ${PROJECT_NAME}_default \\
                                    -e API_URL=http://${PROJECT_NAME}-backend:8000 \\
                                    ${IMG_QA}:${BUILD_NUMBER}

                                echo "🚀 Running Frontend Tests..."
                                # Frontend tests connect to http://${PROJECT_NAME}-frontend:80 mapped in the network
                                docker run --rm \\
                                    --network ${PROJECT_NAME}_default \\
                                    -e BASE_URL=http://${PROJECT_NAME}-frontend:80 \\
                                    ${IMG_QA_FRONTEND}:${BUILD_NUMBER}
                            '
                        """
                    }
                }
            }
        }
    }

    post {
        always {
            // Очистка локальных образов
            sh "docker rmi ${IMG_BACKEND}:${BUILD_NUMBER} ${IMG_BACKEND}:latest || true"
            sh "docker rmi ${IMG_FRONTEND}:${BUILD_NUMBER} ${IMG_FRONTEND}:latest || true"
            
            script {
                if (params.RUN_TESTS) {
                    sh "docker rmi ${IMG_QA}:${BUILD_NUMBER} || true"
                    sh "docker rmi ${IMG_QA_FRONTEND}:${BUILD_NUMBER} || true"
                    
                    // Попытка очистить образ на удаленном сервере
                    sshagent(credentials: [SSH_CREDS]) {
                        sh "ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${DEPLOY_SERVER} 'docker rmi ${IMG_QA}:${BUILD_NUMBER} ${IMG_QA_FRONTEND}:${BUILD_NUMBER} || true'"
                    }
                }
            }
        }
    }
}
