# 訓練 CartPole
npx tsx examples/gym_train.ts --env CartPole --episodes 100 --policy random
# 啟動伺服器
npx tsx src/server/index.ts
# 開啟瀏覽器
open http://localhost:3000/gym_demo.html