import { AppState } from "@/lib/redux/models/app-state";
import { action } from "easy-peasy";

const appState: AppState = {
  isShowSidebar: false, // Thay đổi mặc định thành true để hiện sidebar
  setIsShowSidebar: action((state, payload) => {
    state.isShowSidebar = payload;
  }),
  operationNowPage: 1,
  setOperationNowPage: action((state, payload) => {
    state.operationNowPage = payload;
  }),
  isUpdateAbility: false,
  setIsUpdateAbility: action((state, payload) => {
    state.isUpdateAbility = payload;
  }),
};

export { appState };
