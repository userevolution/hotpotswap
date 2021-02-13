// @flow

import React from "react";
import { Toast as ToastWrapper, ToastBody, ToastHeader } from "reactstrap"

const Ctx = React.createContext();

// Styled Components
// ==============================

const ToastContainer = props => (
  <div style={{ position: "fixed", right: 0, top: 0 }} {...props} />
);

const Toast = ({ title, children, onDismiss }) => {
  return (
    <ToastWrapper style={{ margin: 10 }}>
      <ToastHeader toggle={onDismiss}>
        {title}
      </ToastHeader>
      <ToastBody>
        {children}
      </ToastBody>
    </ToastWrapper>
  )
}

// Provider
// ==============================

let toastCount = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([]);

  const add = ({title , content}) => {
    const id = toastCount++;
    const toast = { title, content, id };
    setToasts([...toasts, toast]);
  };
  const remove = id => {
    const newToasts = toasts.filter(t => t.id !== id);
    setToasts(newToasts);
  };
  // avoid creating a new fn on every render
  const onDismiss = id => () => remove(id);

  return (
    <Ctx.Provider value={{ add, remove }}>
      {children}
      <ToastContainer>
        {toasts.map(({ title, content, id, ...rest }) => (
          <Toast key={id} title={title} Toast={Toast} onDismiss={onDismiss(id)} {...rest}>
            {id + 1} &mdash; {content}
          </Toast>
        ))}
      </ToastContainer>
    </Ctx.Provider>
  );
}

// Consumer
// ==============================

export const useToasts = () => React.useContext(Ctx);
